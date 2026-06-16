---
title: "Converge sync columnsHash schema-cache reload (remove sibling-borrow workaround)"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by PR #3440 (RFC 0030 `columnshash-empty-after-aliased-hash-select`).

trails' sync `loadSchema`/`columnsHash` path (`packages/activerecord/src/model-schema.ts`)
cannot reload a table's columns from the DB synchronously — Rails'
`ActiveRecord::ModelSchema#load_schema` can, via `schema_cache.columns_hash`
hitting the connection when cold. Combined with the test helper
`clearSchemaCache` (`src/test-helpers/with-transactional-fixtures.ts:56`)
wiping the per-connection `SchemaCache` between every test, a model whose
first sync `columnsHash()` lands after a cache clear and has no own
reflection returns an empty hash and un-qualifies its projections.

PR #3440's fix is a trails-specific workaround: `borrowSameTableColumns`
(`model-schema.ts`) copies `_attributeDefinitions` from an already-loaded
same-table sibling on the same connection. It has no Rails counterpart and is
best-effort — it returns null (recurring the empty-synthesize bug) when every
loaded same-table sibling declares its own `ignoredColumns`.

Rails has no sibling-borrow because same-table models share one persistent
schema-cache entry. The faithful convergence is to make trails' schema cache
behave the same: either a synchronous cold-load path, or not clearing
unchanged-table entries between tests (clear only tables touched by DDL, like
Rails' `clear_data_source_cache!`), so a fresh same-table model reads the live
cache entry directly and applies its own `ignoredColumns` at read time.

## Acceptance criteria

- [ ] A fresh same-table model's sync `columnsHash()` returns the table's real
      columns without borrowing from a sibling — sourced from a persistent or
      synchronously-reloadable schema cache entry, matching Rails' shared-cache
      semantics.
- [ ] `borrowSameTableColumns` (and its best-effort `ignoredColumns` caveat) is
      removed once the cache path is faithful, OR a decision is recorded that it
      stays as defense-in-depth with the convergence achieved by the cache path.
- [ ] `relation/select.test.ts` `reselect with default scope select` and the
      `model-schema-columnshash-recovery.test.ts` regression still pass in
      full-file order (SQLite canonical; PG/MySQL per gate).
