---
title: "Serialize all pinned pg.Client queries via promise-chain mutex"
status: done
updated: 2026-07-06
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: ["pg-serialize-fire-and-forget-client-query-sites"]
deps-rfc: []
est-loc: 150
priority: 5
pr: 4670
claim: "2026-07-06T13:15:36Z"
assignee: "pg-pinned-client-query-serializer-mutex"
blocked-by: null
---

## Context

Split out of `pg-pinned-client-write-query-serialization` (the binding-driven PG
hang blocker for `write-path-bind-all-column-types` / PR #3880). This story is
the **core fix**: a serializer (promise-chain mutex) wrapping every
`client.query` on the PG adapter's single pinned `pg.Client` (`_rawConnection`),
so no two queries can overlap on the wire regardless of caller.

### Why

Per the blocker's diagnosis: routing every write through the prepared-statement
path (`_runQuery`) raises `client.query` volume on the single pinned client.
Under CI/load two calls overlap, desync the wire protocol, and leave the
connection **idle-in-transaction**; PG then fires
`FATAL: terminating connection due to idle-in-transaction timeout`, the vitest
worker hangs holding its advisory DB slot, and other workers fail with
`acquireAdvisorySlotPg: all N advisory lock slots are held` → 20-min timeout
with zero test failures. node-pg's own queue is insufficient under this volume
(the `client.query() … already executing a query` deprecation is the seam).

Confirmed in the blocker: the hang reproduces with **only** the `base.ts`
binding change (no PG-adapter edits) at `AR_DB_FORKS=8` and `=2` against
`postgres:17` — so it is the query-volume increase exposing a concurrency bug in
the pinned-client query path, not the OID/type-map work.

### Approach

Introduce an internal per-adapter (per-pinned-client) serialization primitive: a
tail-promise chain so each `_rawConnection.query` awaits the prior call's
settlement before issuing. Route **all** pinned-client query paths through it,
including the `executeMutation` RETURNING/SAVEPOINT path and the `_runQuery`
cached-plan retry path. The fire-and-forget sites (`dealloc`,
`resetBang`/discard) are handled by the sibling story
`pg-serialize-fire-and-forget-client-query-sites`; **this story depends on it**
to avoid `postgresql-adapter.ts` file-overlap conflicts and builds the general
mutex on top.

Must not deadlock: the serializer wraps the pinned client only; nested calls
(e.g. retry path re-entering query) must not await their own outstanding
promise. Honor the existing rawconn / `withRawConnection` and
`_maybeConfigureConnection` constraints (configure-time queries already run
directly on `client.query()` — see RFC 0013 notes; do not re-enter acquire).

## Acceptance criteria

- [ ] All `client.query` calls on the pinned `pg.Client` are serialized against
      the in-flight query (no overlap), so the
      `client.query() … already executing a query` deprecation no longer fires
      and no connection is left idle-in-transaction.
- [ ] The `executeMutation` RETURNING/SAVEPOINT path and `_runQuery` retry path
      both route through the serializer; no self-deadlock on re-entrant/retry
      paths.
- [ ] PG suite green at `AR_DB_FORKS=8` on the existing (non-binding) write
      path; no advisory-slot exhaustion introduced.
- [ ] No regression on SQLite/MySQL; `test:compare` / `api:compare` delta
      non-negative; test names unchanged.

Note: full write-path-binding verification (rebasing #3880's binding change on
top and confirming no hang at `AR_DB_FORKS=8`) is the gate story
`pg-pinned-client-write-query-serialization`, which depends on this + the
fire-and-forget story.

Hard rules: camelCase only; NO node:_/process._; async fs only; 500 LOC ceiling;
single PR from main; draft.
