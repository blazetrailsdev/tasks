---
title: "converge-type-to-sql-base-names-on-native-database-types"
status: ready
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
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

# Source typeToSql base names from nativeDatabaseTypes

## Context

`SchemaCreation#typeToSql`
(`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts:413`)
hardcodes an uppercase switch for every known type — `case "bigint": sql =
"BIGINT"`, `case "datetime": base = "DATETIME"`, `"string" → "VARCHAR"`, and so
on. Rails builds the base name from the adapter's own
`native_database_types[type][:name]`, which is **lowercase** on every adapter,
and returns `type.to_s` verbatim when the adapter declares no entry for the type
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1385-1415`).

Two consequences, both observable on SQLite because SQLite stores the declared
type text verbatim (see
[[project_sqlite_pragma_uppercases_integer_not_bigint]]):

- `NATIVE_DATABASE_TYPES` in
  `vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:69-82`
  has **no `bigint` entry**, so Rails' `type_to_sql(:bigint)` falls through to
  `"bigint"`. trails emits `BIGINT`, and `column.sqlType` reflects back
  `"BIGINT"`.
- `type_to_sql(:datetime, precision: 6)` is `"datetime(6)"` in Rails and
  `"DATETIME(6)"` in trails, so an assertion of the form
  `column.sql_type == connection.type_to_sql("datetime(6)")` (the unrecognized
  string goes through the verbatim pass-through, staying lowercase) fails on
  a case mismatch only.

This blocks four cases of
`vendor/rails/activerecord/test/cases/migration/change_schema_test.rb` that
`port-migration-change-schema-type-reflection-cases` (PR TBD) left out for
being a separate, wide-blast-radius change:

- `test_create_table_with_bigint` (:102-117)
- `test_add_column_with_timestamp_type` (:267-283)
- `test_add_column_with_postgresql_datetime_type` (:285-301)
- `test_change_column_with_timestamp_type` (:318-336)

Groundwork already merged by that PR: the SQLite adapter's **private**
`typeToSql` shadow (which uppercased and then rejected `DATETIME(6)` with
`Invalid SQL type`) is gone, `_baseColumnType` routes through the public
`SchemaStatements#typeToSql`, and `typeToSql` is declared on the
`AbstractAdapter` interface so tests can call it.

Blast radius to expect: every schema-dumper snapshot and every assertion on
`column.sqlType` for a SQLite-lane table, plus the MySQL/PG `type_to_sql`
call sites. Budget for a dedicated PR under the 500-LOC ceiling; split by
adapter lane if needed.

## Acceptance criteria

- [ ] `SchemaCreation#typeToSql` derives its base name from
      `this.adapter.nativeDatabaseTypes()[type]?.name`, falling back to
      `String(type)` verbatim when the adapter declares no entry — matching
      `schema_statements.rb:1385-1415`. The hardcoded uppercase switch keeps
      only the precision/scale/limit suffix and validation rules.
- [ ] `nativeDatabaseTypes()` on each adapter mirrors its Rails
      `NATIVE_DATABASE_TYPES` exactly (notably: SQLite has no `bigint`).
- [ ] The four cases above are ported under `Migration > ChangeSchemaTest` in
      `packages/activerecord/src/migration/change-schema.test.ts` with names
      matching Rails verbatim, and their assertions are not weakened.
- [ ] `test:compare` for `migration/change_schema_test.rb` reaches 35/35 with
      0 gate-mismatch and 0 misplaced.
- [ ] Green on all three lanes.
