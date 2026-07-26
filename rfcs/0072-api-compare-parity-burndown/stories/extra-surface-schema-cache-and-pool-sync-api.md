---
title: "extra-surface: classify schema-cache and connection-pool sync accessor surface"
status: in-progress
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps:
  [
    "extra-surface-honor-internal-jsdoc-on-file-functions",
    "extra-surface-skip-reexported-class-entries",
  ]
deps-rfc: []
est-loc: 150
priority: 35
pr: 5343
claim: "2026-07-26T11:26:55Z"
assignee: "extra-surface-schema-cache-and-pool-sync-api"
blocked-by: null
closed-reason: null
---

## Context

Found by the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25). Two adjacent files carry 25 novel extras between them and share
one root cause: trails' schema-cache/pool layer exposes a **sync accessor API
that Rails does not have**, because Rails reads the cache through blocking
calls while trails needs a sync path alongside the async one.

`packages/activerecord/src/connection-adapters/schema-cache.ts` — 12 novel,
2 moved:

- `getCachedColumnsHash` (`schema-cache.ts:285`), `isColumnsHashCached`,
  `getCachedPrimaryKeys`, `getCachedDataSourceExists` — sync readers with no
  Rails counterpart (Rails' `columns_hash(table)` is the only accessor).
- `setColumns` (`:426`), `setPrimaryKeys`, `setDataSourceExists` — sync
  writers; Rails populates the cache only via `add(table_name)`.
- `loadAllBang` (referenced `:614`, `:621`), `eagerLoadSchemaCache`,
  `loadedCache` — trails' eager-warming path. See the parked
  schema-cache-warming work; cross-check before classifying.
- `recordTouchedTables` (`:400`), `takeTouchedTables` (`:405`) — a
  touched-table ledger with no Rails analogue.

`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts` —
13 novel, 10 moved:

- `NULL_CONFIG` (`connection-pool.ts:70`, re-exposed as a static at `:114`)
  and `NullConfig` — the null-object config trails introduced.
- `poolAbsent` (`:173`), `realPool` (`:184`) — the pool-vs-adapter
  disambiguation helpers. `realPool` is load-bearing (see the
  schema-cache-pool-target finding: schema-cache must target `realPool`, not
  the bare pool), so this is a documented deviation, not removable.
- `leaseConnectionSync` (`:623`), `adapterReady`, `queryCacheDisabled`,
  `withQueryCache`, `peek` (`:227`) — sync/introspection surface over Rails'
  blocking `lease_connection` / `with_connection`.
- `drainPendingCloses` (`:315` doc ref), `trackCloseDrain`,
  `discardBangDraining` — the async close-draining bookkeeping Ruby doesn't
  need.
- `setConnectionHandlerResolver` — wiring hook.

The same names re-appear on `connection-adapters.ts`'s novel list
(`getCachedColumnsHash`, `setColumns`, `leaseConnectionSync`,
`drainPendingCloses`, …) purely because that file re-exports these classes —
that is the re-export double-count artifact, filed separately; do not treat
them as two separate problems.

Nearly all of these are genuine, justified deviations forced by JS async
semantics, so the expected disposition is heavily (b) — but the reason must
be written at the call site, and any that turn out to be dead or
single-caller wrappers should be removed instead.

## Acceptance criteria

- Each of the 25 names classified as: `@internal`/allowlisted-with-reason,
  removed as dead or redundant, or renamed toward an existing Rails name
  (check `SchemaCache#add`, `#columns_hash`, `#data_source_exists?` and
  `ConnectionPool#lease_connection`, `#with_connection` in
  `vendor/rails/activerecord/lib/active_record/connection_adapters/` first).
- Every retained deviation carries its justification in a comment at the
  declaration — "async/sync split" alone is not enough; say what the sync
  caller is and why it cannot await.
- Sequence after the `@internal`-on-fileFunctions and re-export
  double-counting tooling fixes so the list is not inflated; re-run
  `pnpm api:extra --package activerecord --json` first and work from the
  refreshed list.
- `pnpm vitest run packages/activerecord/src/connection-adapters/schema-cache.test.ts`
  and the connection-pool test files pass; no test renames.
- Record schema-cache.ts and connection-pool.ts novel before/after in the PR
  body. Keep under the 500 LOC ceiling — if both files don't fit, ship one
  and register the other as a new story rather than opening a sibling PR.

## Fidelity-first policy

Moving toward Rails fidelity is the stated goal of this (and every)
extra-surface story; the allow-set/allowlist is a **last resort**. Before
admitting or keeping any name in the allow-set, first make — or file as its own
story — the fidelity change that would make the entry unnecessary: converge the
TS surface onto the Rails name and Rails-layout file (relocate + rename),
delete the invention, or justify an `@internal` at the declaration site. Only
names that are faithful-but-unmappable (e.g. genuine Ruby file constants or
nested class names present in the matched Rails file) belong in the allow-set;
any other allowlisted entry must cite the filed fidelity story next to it.
