---
title: "PG pinned-client write-path query serialization"
status: ready
updated: 2026-06-29
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`write-path-bind-all-column-types` (PR #3880) converged the INSERT/UPDATE write
path to bind **all** column values as typed prepared-statement parameters
(Rails `type_casted_binds` parity), instead of inlining non-string types. That
change works on SQLite and MySQL/MariaDB, but **deterministically hangs the
PostgreSQL test suite**, which blocks the story.

### Diagnosis (from PR #3880 CI + local reproduction)

Binding routes _every_ write through the prepared-statement path
(`_runQuery`), substantially increasing the volume of `client.query` calls
issued on the PostgreSQL adapter's **single pinned `pg.Client`**
(`_rawConnection`). Under CI/load timing this tips a pre-existing latent
fragility into a hard failure:

- node-pg emits `DeprecationWarning: Calling client.query() when the client is
already executing a query` (present on `main` too — the pattern is baseline,
  normally tolerated because node-pg queues).
- With the increased write-path query volume, two `client.query` calls overlap
  on the pinned client and desync the wire protocol.
- The connection is left **idle-in-transaction**; PG fires
  `FATAL: terminating connection due to idle-in-transaction timeout`.
- The owning vitest worker hangs (the dangling promise never settles), holding
  its advisory DB slot. Other workers then fail with
  `acquireAdvisorySlotPg: all N advisory lock slots are held` and the job
  times out at 20 min with **zero test failures** (a silent ~7-min stall
  before the runner SIGTERM).

Confirmed reproducible locally against a `postgres:17` container: full suite at
`AR_DB_FORKS=8` and `=2` both reproduce the advisory-slot exhaustion. The hang
is present even with **only** the `base.ts` binding change (no PG-adapter
edits), so it is the binding-driven query-volume increase exposing the
concurrency bug — not the OID/type-map fixes (those are correct and green:
hstore + composite pass).

### Unawaited / non-serialized `client.query` sources to audit

(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`)

- `dealloc` (~line 5133): `client.query("DEALLOCATE …").catch(() => {})` —
  fire-and-forget on the pinned client; can race the next query on LRU
  eviction / `delete()` (cached-plan retry) / `clearCacheBang`.
- `resetBang`/discard path (~lines 2491, 2510): `live.query("ROLLBACK")` /
  `.then(() => live.query("DISCARD ALL"))`.
- The `executeMutation` RETURNING/SAVEPOINT path and `_runQuery` retry path.

## Acceptance criteria

- [ ] All `client.query` calls on the pinned `pg.Client` are serialized against
      the in-flight query (no overlapping issue), so the
      `client.query() … already executing a query` deprecation no longer fires
      and no connection is left idle-in-transaction under the write-heavy
      prepared-statement path.
- [ ] With `write-path-bind-all-column-types`'s binding change applied, the
      full PostgreSQL `pnpm vitest run packages/activerecord/` suite completes
      (no advisory-slot exhaustion, no 20-min timeout) at `AR_DB_FORKS=8`.
- [ ] No regression on SQLite/MySQL; `test:compare` / `api:compare` delta
      non-negative; test names unchanged.

## Notes

This is a prerequisite/blocker for `write-path-bind-all-column-types`. PR #3880
is parked (draft) until this lands; rebase/re-run its PG job afterward to
confirm the hang is resolved, then complete that story.
