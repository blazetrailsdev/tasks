---
title: "Serialize fire-and-forget client.query sites on pinned pg.Client"
status: done
updated: 2026-06-29
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 0
pr: 4284
claim: "2026-06-29T18:23:40Z"
assignee: "pg-serialize-fire-and-forget-client-query-sites"
blocked-by: null
---

## Context

Split out of `pg-pinned-client-write-query-serialization` (the binding-driven PG
hang blocker for `write-path-bind-all-column-types` / PR #3880). That story's
diagnosis identified several **fire-and-forget / non-serialized `client.query`
calls** on the PG adapter's single pinned `pg.Client` (`_rawConnection`) that
race the next query under load. This story fixes those call sites in isolation —
it is landable on `main` today, independent of the write-path binding change,
and reduces the race surface before the central serializer lands.

Sites to fix (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`):

- `dealloc` (~line 5133): `client.query("DEALLOCATE …").catch(() => {})` —
  fire-and-forget on the pinned client; races the next query on LRU eviction /
  `delete()` (cached-plan retry) / `clearCacheBang`.
- `resetBang`/discard path (~lines 2491, 2510): `live.query("ROLLBACK")` /
  `.then(() => live.query("DISCARD ALL"))` — chained but not serialized against
  other in-flight queries on the same pinned client.

These produce node-pg's `DeprecationWarning: Calling client.query() when the
client is already executing a query` (present on `main`; baseline-tolerated
because node-pg queues, but the seam for the wire-protocol desync).

This is deliberately the **smaller, lower-risk half**: await/chain these calls
so they no longer fire-and-forget. The general "serialize every query on the
pinned client" mutex is the sibling story
`pg-pinned-client-query-serializer-mutex` (which depends on this one to avoid
`postgresql-adapter.ts` file-overlap conflicts).

## Acceptance criteria

- [ ] `dealloc`'s `DEALLOCATE` is awaited/serialized (no bare
      `.catch(() => {})` fire-and-forget) so it cannot race the subsequent query
      on the pinned client.
- [ ] `resetBang`/discard `ROLLBACK` + `DISCARD ALL` are serialized against the
      in-flight query on the pinned client.
- [ ] The node-pg `client.query() … already executing a query` deprecation no
      longer fires from these specific sites (verify under the existing PG lane;
      full write-path verification is the gate story's job).
- [ ] No regression on SQLite/MySQL; `test:compare` / `api:compare` delta
      non-negative; test names unchanged.

Hard rules: camelCase only; NO node:_/process._; async fs only; 500 LOC ceiling;
single PR from main; draft.
