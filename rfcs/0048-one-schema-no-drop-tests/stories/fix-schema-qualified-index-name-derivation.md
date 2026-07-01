---
title: "fix-schema-qualified-index-name-derivation"
status: ready
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
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

Root cause — trails is missing **two** PG-adapter overrides that Rails has:

1. **`index_name` schema strip.** Rails' PG override
   (`vendor/rails/.../postgresql/schema_statements.rb:576`) does
   `_schema, table_name = extract_schema_qualified_name(table_name.to_s); super`,
   so `index_name("my_schema.values", …)` yields `index_values_on_value` — the
   schema is stripped before the base `index_${table}_on_${cols}` derivation
   (`connection-adapters/abstract/schema-statements.ts:962`/`:2030`). trails has
   no PG override, so it produces `index_my_schema.values_on_value`.
2. **Schema-qualified `DROP INDEX`.** Rails' PG `remove_index`
   (`postgresql/schema_statements.rb:543`) builds
   `PostgreSQL::Name.new(table.schema, index_name_for_remove(...))` and drops
   `"my_schema"."index_values_on_value"`. trails uses the schema-unaware base
   `removeIndex` (`schema-statements.ts:484`: bare `DROP INDEX ${_qi(name)}`),
   which searches `search_path` and can't find an index living in `my_schema`.

Net effect on the faithful port: `add_index("my_schema.values", :value)` creates
`index_my_schema.values_on_value`, then `remove_index` fails with
`index "index_my_schema.values_on_value" does not exist` (SQLSTATE 42704).

The test is currently `it.skip`-ped in migration.test.ts with a pointer to this
story; the body is the faithful Rails port and should be un-skipped once the
overrides land. This was deliberately deferred out of PR #4370 (a test-only
convergence) because the fix is a multi-method PG-adapter change touching every
schema-qualified index operation.

## Acceptance criteria

- [ ] Add a PG `index_name` override that strips the schema qualifier before the
      base derivation (mirror `postgresql/schema_statements.rb:576`).
- [ ] Add a PG `remove_index`/`index_exists?` path that schema-qualifies the
      `DROP INDEX` and the lookup using the table's schema (mirror
      `postgresql/schema_statements.rb:543` via `PostgreSQL::Name` /
      `quoted_scope`), so create/drop/exists agree.
- [ ] Un-skip `IndexForTableWithSchemaMigrationTest > add and remove index` in
      `packages/activerecord/src/migration.test.ts`; it passes on the PG lane.
- [ ] Test name unchanged; test:compare does not regress.
