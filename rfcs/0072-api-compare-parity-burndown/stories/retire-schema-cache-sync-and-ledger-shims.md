---
title: "retire-schema-cache-sync-and-ledger-shims"
status: done
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6095
claim: "2026-08-04T21:47:01Z"
assignee: "converge-table-definition-index-deferred-options"
blocked-by: null
closed-reason: null
---

## Context

Found by the `@noRailsEquivalent` tag audit (RFC 0080).
`connection-adapters/schema-cache.ts` carries nine tagged members that all
trace to one root cause — trails' schema-cache accessors are async where
Rails' block on a checkout — plus the test-harness ledger built on top of it:

- Sync read shims: `getCachedColumnsHash` (:300), `getCachedDataSourceExists`
  (:314), `getCachedPrimaryKeys` (:358), `loadedCache` (:803)
- Pool-less write path: `setColumns` (:476)
- Test-harness ledger: `recordTouchedTables` (:425), `takeTouchedTables` (:439)
- Composites with no Rails counterpart: `loadAllBang` (:785),
  `eagerLoadSchemaCache` (:735)

Rails' equivalents are `columns_hash(pool, table)`, `data_source_exists?(pool,
name)`, `primary_keys(pool, table)` and `add(pool, table_name)`, each of which
can block on `cache(pool)`; `SchemaReflection` needs no sync peek and Rails has
only `lazily_load_schema_cache`, no `load_all!` and no eager warm.

Each reason is honest about the mechanism but every one is an artifact of the
sync/async split, which is convergeable work (see RFC 0073, the permanent
connection-checkout flip) — not a permanent language fact. Sibling story
`retire-schema-cache-test-only-sync-writers` already covers `setPrimaryKeys`
and `setDataSourceExists`; this one covers the remaining nine.

## Acceptance criteria

- Establish which of the nine survive once the schema-cache accessors can
  block on a checkout the way Rails' do, and record the finding per member.
- Retire the shims that become redundant, moving their callers onto the
  Rails-named accessor, and delete their `@noRailsEquivalent` tags.
- Members that genuinely cannot converge until RFC 0073 lands are marked
  `@internal` rather than tagged, or the tag reason names RFC 0073 as the
  blocker instead of claiming no Rails equivalent exists.
- `pnpm vitest run packages/activerecord/src/connection-adapters/schema-cache.test.ts`
  passes; no test name is renamed.
- `pnpm parity:api:extra --package activerecord` reports no stale tags.
