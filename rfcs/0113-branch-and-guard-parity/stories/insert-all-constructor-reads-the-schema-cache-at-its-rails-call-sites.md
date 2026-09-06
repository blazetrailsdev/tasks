---
title: "insert-all-constructor-reads-the-schema-cache-at-its-rails-call-sites"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 49
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`insert-all-builder-reads-a-prewarmed-schema-cache-snapshot` converged the
BUILDER half: `extractTypesFromColumnsOn` now reads
`this.model.schemaCache().columnsHash(tableName)` where
`vendor/rails/activerecord/lib/active_record/insert_all.rb:307` reads it, and
`InsertAll#schemaCacheColumnsHash` and its `tableName === this.model.tableName`
branch are gone.

`ResolvedConnectionFacts` / `resolveConnectionFacts`
(`packages/activerecord/src/insert-all.ts`) survive, narrowed, for the reads
`InsertAll#initialize` makes and a TypeScript constructor cannot await:

- `connection.supports_insert_returning?` (`insert_all.rb:38`)
- `primary_keys` → `@model.schema_cache.primary_keys` (`insert_all.rb:41,61`)
- `find_unique_index_for` → `unique_indexes` → `schema_cache.indexes`
  (`insert_all.rb:41,169-171`)

All three are synchronous in Ruby and async in trails, and all three run inside
`initialize`, so the prewarm cannot be deleted without moving that constructor
tail somewhere Rails does not put it.

## Acceptance criteria

- [ ] `ResolvedConnectionFacts` / `resolveConnectionFacts` and their
      `@noRailsEquivalent PERMANENT` receipts are gone.
- [ ] `primaryKeys()`, `uniqueIndexes()` and the `supports*` reads happen at
      their Rails call sites, without changing where `insert_all.rb:19-45` puts
      the work.
- [ ] `insert-all.test.ts` and `upsert-all.test.ts` stay green on all three
      adapter lanes.
- [ ] No new baseline row, `@noRailsEquivalent` tag or skip.
