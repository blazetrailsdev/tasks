---
title: "InsertAll::Builder reads a prewarmed schema-cache snapshot instead of the cache at Rails' call sites"
status: draft
updated: 2026-08-30
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`InsertAll::Builder#values_list` reads the schema cache inline —
`vendor/rails/activerecord/lib/active_record/insert_all.rb:239` calls
`extract_types_from_columns_on(model.table_name, keys: keys_including_timestamps)`,
whose body (`insert_all.rb:306-313`) is
`columns = @model.schema_cache.columns_hash(table_name)`.

In trails every schema-cache read is async while the Builder body that consumes
it is not: `into()` / `valuesList()` are called synchronously from each
adapter's `buildInsertSql`. So the cache reads the Builder needs are hoisted
into `resolveConnectionFacts` — a trails-invented async prewarm run before the
constructor, carrying `@noRailsEquivalent PERMANENT` receipts:

- `packages/activerecord/src/insert-all.ts` — `ResolvedConnectionFacts` and
  `resolveConnectionFacts` (the interface and the function), and
  `InsertAll#schemaCacheColumnsHash`, added by PR #7274 to hold the
  `columns_hash` the guard checks against.

Rails' `unique_indexes` (`insert_all.rb:169-171`) and `primary_keys` read the
cache at their own call sites; trails reads all of them up front and hands the
Builder a snapshot. The snapshot is also keyed on `model.tableName`, an extra
branch Rails does not have, because the facts closure can only answer for the
one table it warmed.

## Converged shape

Make the Builder's SQL construction async end to end — `buildInsertSql` and the
`into` / `valuesList` / `conflictTarget` bodies it drives — so each site reads
`schemaCache.columnsHash(tableName)` / `.indexes(tableName)` where Rails reads
it, and `resolveConnectionFacts`, `ResolvedConnectionFacts` and
`schemaCacheColumnsHash` are all deleted along with their receipts. `toSql()` is
already `async`, so the ripple stops at each adapter's `buildInsertSql`
override.

## Acceptance criteria

- `extractTypesFromColumnsOn` reads the schema cache directly, as
  `insert_all.rb:307` does; `schemaCacheColumnsHash` and its `tableName ===
  this.model.tableName` branch are gone.
- `resolveConnectionFacts` / `ResolvedConnectionFacts` are gone, with their
  `@noRailsEquivalent PERMANENT` receipts, and `unique_indexes` / `primary_keys`
  read the cache at their Rails call sites.
- `insert-all.test.ts` stays green on all three adapter lanes, including the
  `UnknownAttributeError` cases.
- No new baseline row, `@noRailsEquivalent` tag or skip.
