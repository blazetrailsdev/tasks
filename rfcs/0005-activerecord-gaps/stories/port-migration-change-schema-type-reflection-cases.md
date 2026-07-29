---
title: "port-migration-change-schema-type-reflection-cases"
status: done
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5568
claim: "2026-07-29T03:25:46Z"
assignee: "port-migration-change-schema-type-reflection-cases"
blocked-by: null
closed-reason: null
---

# Port the type-reflection cases of ChangeSchemaTest

## Context

PR for `port-migration-change-schema-cases` ported 27 of the 35 cases in
`vendor/rails/activerecord/test/cases/migration/change_schema_test.rb` into
`packages/activerecord/src/migration/change-schema.test.ts`. Seven were left
out because each one fails on a **production** divergence, not on a porting
gap, and fixing them does not fit under the 500-LOC ceiling of that PR (it
landed at 495).

`test:compare` for `migration/change_schema_test.rb` now reads
`27 OK / 0 wrong-describe / 0 gate-mismatch / 0 misplaced / 7 missing`.

The seven missing cases and the divergence each is blocked on:

1. `test_create_table_with_bigint` (change_schema_test.rb:102-117) —
   asserts `eight.sql_type == "bigint"` on SQLite. trails emits uppercase
   type names from `SchemaCreation#typeToSql`
   (`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts:436`,
   `case "bigint": sql = "BIGINT"`), and SQLite reflects the declared type
   verbatim, so `sqlType` comes back `"BIGINT"`. Rails' SQLite
   `native_database_types[:bigint]` is the lowercase `"bigint"`.
   Related: [[project_sqlite_pragma_uppercases_integer_not_bigint]].

2. `test_create_table_with_primary_key_prefix_as_table_name_with_underscore`
   (:152-160) and
3. `test_create_table_with_primary_key_prefix_as_table_name` (:162-170) —
   both set `ActiveRecord::Base.primary_key_prefix_type` and expect
   `create_table` to name the implicit PK column `testing_id` / `testingid`.
   Rails resolves it in `TableDefinition#set_primary_key` via
   `Base.get_primary_key(table_name.to_s.singularize)`
   (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:397`).
   trails hardcodes `const pkName = primaryKey ?? "id"`
   (`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:1029`)
   and the constructor path `createTable` actually uses does the same, so
   `primaryKeyPrefixType` has no effect on DDL. Wiring `Base.getPrimaryKey`
   into `TableDefinition` needs care about the import direction — see
   [[project_join_table_leaf_module_import_breaks_base_init]].

4. `test_add_column_with_timestamp_type` (:267-283),
5. `test_add_column_with_postgresql_datetime_type` (:285-301) and
6. `test_change_column_with_timestamp_type` (:318-336) — all three assert
   `column.sql_type == connection.type_to_sql("datetime(6)")` on the SQLite
   lane. `sqlite3-adapter.ts` declares a **private** `typeToSql`
   (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1957`)
   that shadows the public `SchemaStatements#typeToSql`; it uppercases and
   then rejects the result with `Invalid SQL type: DATETIME(6)`. Rails'
   `type_to_sql` returns an unrecognized type verbatim
   (`schema_statements.rb:1414-1415`), which our `SchemaCreation#typeToSql`
   default branch already does correctly — the adapter's private shadow is
   the divergence.

7. `test_add_column_with_datetime_in_timestamptz_mode` (:303-316) — PG-only,
   needs `with_postgresql_datetime_type`. trails' port lives in
   `packages/activerecord/src/adapters/postgresql/test-helper.ts:20`, but
   importing it from `migration/change-schema.test.ts` drags in
   `support/describe-if-pg.js`, whose top-level `await` probes a PG server on
   every lane. Either relocate the helper somewhere lane-neutral or gate the
   import.

## Acceptance criteria

- [ ] The seven cases above are ported under `Migration > ChangeSchemaTest`
      in `packages/activerecord/src/migration/change-schema.test.ts` with
      names matching Rails verbatim.
- [ ] The underlying production divergences are fixed rather than the
      assertions being weakened to match trails.
- [ ] `test:compare` for `migration/change_schema_test.rb` reaches 35/35
      with 0 gate-mismatch and 0 misplaced.
- [ ] Green on all three lanes.
- [ ] Split across PRs under the 500-LOC ceiling if needed — the SQLite
      uppercase-type change (1) and the `typeToSql` shadow (4-6) each have a
      wide blast radius on schema-dumper snapshots and are good split points.
