---
title: "fix-schema-qualified-index-name-derivation"
status: ready
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
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

Surfaced by the faithful port of `IndexForTableWithSchemaMigrationTest > add
and remove index` in `packages/activerecord/src/migration.test.ts` (PR #4370,
story converge-migration-test-people-migration-and-bespoke-schema). Rails'
`migration_test.rb:1204` runs `connection.add_index("my_schema.values", :value)`
then `connection.remove_index("my_schema.values", :value)` against a
Postgres-schema-qualified table, asserting `index_exists?` flips true→false.

trails derives the index name from the raw table name verbatim
(`connection-adapters/abstract/schema-statements.ts:962` `indexName` and
`:2030` `generateIndexName`: `index_${tableName}_on_${cols}`), so for
`my_schema.values` it produces `index_my_schema.values_on_value`. `add_index`
creates the index (name quoted, stored in schema `my_schema`), but
`remove_index`'s `DROP INDEX` resolves the dotted name asymmetrically — PG reads
`index_my_schema` as the schema and `values_on_value` as the index — and fails
with `index "index_my_schema.values_on_value" does not exist` (SQLSTATE 42704).

The test is currently `it.skip`-ped in migration.test.ts with a pointer to this
story; the body is the faithful Rails port and should be un-skipped once the
schema-qualified index-name handling is fixed.

## Acceptance criteria

- [ ] `add_index`/`remove_index`/`index_exists?` handle a Postgres
      schema-qualified table (`my_schema.values`) symmetrically: the index name
      derivation strips/quotes the schema so create and drop agree (mirror
      Rails' PG `quoted_scope` split of schema vs table).
- [ ] Un-skip `IndexForTableWithSchemaMigrationTest > add and remove index` in
      `packages/activerecord/src/migration.test.ts`; it passes on the PG lane.
- [ ] Test name unchanged; test:compare does not regress.
