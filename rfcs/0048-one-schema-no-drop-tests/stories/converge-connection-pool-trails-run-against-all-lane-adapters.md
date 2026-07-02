---
title: "Converge connection-pool.trails.test.ts to run against all lane adapters (sqlite/postgres/mysql), not hardcoded SQLite"
status: claimed
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-02T02:10:02Z"
assignee: "converge-connection-pool-trails-run-against-all-lane-adapters"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-pool.trails.test.ts` hardcodes SQLite for
every test: it constructs `BetterSQLite3Adapter` directly and passes
`adapter: "sqlite3"` in the `HashConfig`, writing throwaway DBs to
`fs.mkdtempSync` temp files (e.g. `:48`, `:127`, `:229`, `:464`, `:564`, `:609`,
`:649`, `:698`, `:749`, `:792`, `:839`). Because the file never consults the
ambient lane adapter, the whole suite runs SQLite even in the `postgres` and
`mysql:8` CI lanes — it opens no PG/MySQL connection and adds zero coverage
there, just re-running the same SQLite unit tests three times.

Vendored Rails does the opposite. `connection_pool_test.rb` builds its duplicate
pool from the **ambient** adapter:

- `:20` `config = ActiveRecord::Base.connection_pool.db_config` — takes whatever
  adapter the current lane runs (sqlite/postgres/mysql).
- `:21-27` clones that `HashConfig`, merging only a `checkout_timeout: 0.2`
  override (nothing adapter-specific).
- `:29-30` builds the duplicate `PoolConfig` / `ConnectionPool` from that
  ambient config.
- `:32-40` only when `in_memory_db?` does it stub a scratch table on the fly
  (`connection.create_table :posts`), because separate connections to a
  `:memory:` SQLite DB each get a fresh empty schema. Against real
  PG/MySQL/file-SQLite it rides the real ambient schema — no scratch table.

So Rails exercises these pool tests against all three adapters; the trails port
collapsed that to SQLite-only. This is a genuine fidelity gap, distinct from the
scratch-table-name convergence in PR #4384 (which only renamed the invented
`gizmos`/`gadgets` fixtures to real Rails names but left the SQLite-hardcoding
in place).

Trails already has every primitive needed to converge:

- `test-adapter.ts:31` `adapterType` — `"sqlite" | "postgres" | "mysql"`.
- `test-adapter.ts:53` `inMemoryDb()` — explicit mirror of Rails'
  `in_memory_db?` (SQLite3Adapter with an in-memory database).
- `test-adapter.ts` `newRawTestAdapter` / the shared `adapterFactory` — already
  imported by `connection-pool.trails.test.ts:23`; produces a fresh adapter for
  the active lane.
- The ambient pool `dbConfig` is reachable the same way production code does it
  (`connection-handling.ts:131` resolves `dbConfig` for the current connection).

## Acceptance criteria

- `connection-pool.trails.test.ts` no longer hardcodes `adapter: "sqlite3"` or
  `BetterSQLite3Adapter`. Each pool-under-test is built from the **ambient**
  lane adapter (via the shared `test-adapter` factory + the ambient `dbConfig`),
  mirroring Rails `connection_pool_test.rb:20-30`, with the same
  `checkoutTimeout` override where the corresponding Rails test uses one.
- Scratch-table stubbing happens **only** when `inMemoryDb()` is true, mirroring
  Rails `:32-40`. In the PG/MySQL (and file-SQLite) lanes the tests ride the
  ambient/canonical schema and create no throwaway table. Any scratch table
  that must exist uses a real Rails name (Rails uses `posts`), not an invented
  one — do not reintroduce `gizmos`/`gadgets`.
- The suite genuinely runs against sqlite, postgres, and mysql:8 in their
  respective CI lanes (verify each lane actually opens a lane-native connection,
  not SQLite). Do **not** solve this by adding `skipIf(adapterType !== "sqlite")`
  — the goal is real multi-adapter coverage matching Rails, not gating the file
  off the non-SQLite lanes.
- Tests that are legitimately SQLite-specific by nature (if any survive audit)
  are the only ones allowed a `skipIf`, and each must carry a one-line reason
  tying it to a Rails `sqlite3_adapter`-only equivalent.
- Test names stay verbatim. `api:compare` and `test:compare` deltas are
  non-negative.

## Notes

Follow-up to PR #4384 (converge-connection-pool-trails-gizmos-scratch-table) and
PR #4376. Companion to the sibling `.trails` DDL convergence work. Watch for the
shared-worker-DB implications: once these ride the ambient worker DB instead of
isolated temp files, any table they touch must be canonical / properly torn down
to avoid cross-file collisions in the parallel-fork lanes (see the shared-DB
shape-drift class of flakes).

Hard rules: NO `node:*` imports in new code, NO `process.*` references, async fs
only, no new third-party runtime deps, 500 LOC ceiling, single PR from main,
test names match Rails verbatim.
