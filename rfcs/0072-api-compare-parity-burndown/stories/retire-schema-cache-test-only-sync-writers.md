---
title: "retire-schema-cache-test-only-sync-writers"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while classifying extra surface in #5343
(`extra-surface-schema-cache-and-pool-sync-api`). Two sync writers on
`SchemaCache` (`packages/activerecord/src/connection-adapters/schema-cache.ts`)
have **no production caller at all** — they are exercised only by tests:

- `setPrimaryKeys(tableName, pk)` (`schema-cache.ts:437` pre-#5343)
- `setDataSourceExists(tableName, exists)` (`:478` pre-#5343)

(Confirmed by grepping every non-test `.ts` under `packages/*/src`: the
only production caller of the writer trio is `setColumns`, from
`AbstractAdapter#columnForAttribute`'s bare-adapter branch.)

They were kept in #5343, marked `@internal` and allowlisted, because
removing them means changing how the ported Rails tests set up state.
Rails' `SchemaCache` tests drive a live `@cache` bound to a real
connection and let the blocking `add` / `primary_keys` /
`data_source_exists?` warm the maps; the trails ports run pool-less and
seed the maps directly through these writers.

Affected ported tests in `schema-cache.test.ts`: `test_clearing`,
`test_marshal_dump_and_load`, `test_clear_data_source_cache`,
`test_data_source_exist`, the `columns_hash?`/`data_source_exists?`
population test, plus the primary-key-reconciliation cases.

Retiring the writers would move those tests closer to Rails (they would
exercise the real `add` / `primary_keys` path rather than a trails-only
seeder), which is a fidelity gain beyond the surface-count win.

## Acceptance criteria

- Establish whether the affected tests can drive a real pool (the
  canonical schema + `FakePool` / lone-connection path already used
  elsewhere in `schema-cache.test.ts`) instead of seeding via the writers.
- If yes: port them to the Rails-shaped setup, delete `setPrimaryKeys` and
  `setDataSourceExists`, and drop both `extra-surface-allow.json` entries.
  Do NOT rename or reword any test name in the process — the ported names
  match Rails and are how `test:compare` matches them.
- If some test genuinely cannot (e.g. it must assert on a cold cache with
  no connection), keep the writer it needs, and record that specific test
  as the reason at the declaration.
- `reconcilePrimaryKeyFlags` must keep its order-independence guarantee:
  whichever of the columns/primary-key warms lands second reconciles the
  flags. If `setPrimaryKeys` goes, confirm `add()` still provides that.
- `pnpm api:extra --package activerecord` must not regress
  `connection-adapters/schema-cache.ts` above 0 novel.
- `pnpm vitest run packages/activerecord/src/connection-adapters/schema-cache.test.ts`
  passes.
