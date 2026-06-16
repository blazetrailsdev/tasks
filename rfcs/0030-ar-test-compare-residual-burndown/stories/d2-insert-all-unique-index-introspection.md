---
title: "insert_all unique_by schema-cache index introspection"
status: claimed
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: persistence
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-06-16T12:04:59Z"
assignee: "d2-insert-all-unique-index-introspection"
blocked-by: null
---

## Context

Follow-up from d2-insert-all-on-duplicate (RFC 0030). `find_unique_index_for`
(packages/activerecord/src/insert-all.ts:344) + `uniqueIndexes()` rely on
`schema_cache.indexes()`, which does not surface partial-index WHERE clauses,
expression-index SQL, or inverted column-order matching. The test harness
`defineSchema` also has no way to declare indexes, so unique_by-by-index-name
and partial/expression-index conflict targets cannot be exercised.

Needs: (1) schema-cache unique-index introspection carrying `where`/expression
metadata across sqlite/pg/mysql, and (2) `defineSchema` index support (or a
migration to canonical models whose schema.rb defines the books indexes).

Blocks these `it.skip` tests in `packages/activerecord/src/insert-all.test.ts`:

- upsert all with unique_by column not an index raises error
- insert all with partial unique index
- insert all and upsert all with index finding options
- insert all and upsert all with expression index
- insert all and upsert all raises when index is missing
- insert all and upsert all finds index with inverted unique by columns
- upsert all does not update primary keys
- upsert all does not perform an upsert if a partial index doesnt apply
- upsert all updates existing record by configured primary key fails when database supports insert conflict target
- insert all with skip duplicates and autonumber id not given
- insert all with skip duplicates and autonumber id given
- insert all will raise if duplicates are skipped only for a certain conflict target

## Acceptance criteria

- [ ] schema-cache exposes unique indexes with where/expression metadata.
- [ ] `find_unique_index_for` matches by index name, inverted column order,
      and partial-index where clause; raises "No unique index" when missing.
- [ ] The listed tests are un-skipped and pass under the Rails ruby gate.
