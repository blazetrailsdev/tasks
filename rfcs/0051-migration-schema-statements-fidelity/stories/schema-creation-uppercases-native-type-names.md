---
title: "SchemaCreation typeToSql uppercases native type names Rails keeps lowercase"
status: ready
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaCreation#typeToSql`
(`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts:413`)
emits every native type name uppercased — `"BIGINT"`, `"INTEGER"`, `"VARCHAR"`,
`"DECIMAL"`. Rails sources these from each adapter's
`native_database_types` hash, which is **lowercase** (`bigint`, `integer`,
`varchar`).

On SQLite this is observable, not cosmetic: SQLite stores the declared type
verbatim and `PRAGMA table_info` reflects it back, so `column.sql_type` comes
back `"BIGINT"` where Rails reports `"bigint"`. Related:
[[project_sqlite_pragma_uppercases_integer_not_bigint]].

Surfaced by PR #5558, which had to leave `test_create_table_with_bigint`
(`change_schema_test.rb:102-117`) unported — it asserts
`assert_equal "bigint", eight.sql_type` on the SQLite lane.

Blast radius is wide: schema-dumper snapshots and any assertion comparing
`sqlType` strings. Expect to re-baseline snapshots as part of this.

## Acceptance criteria

- [ ] `SchemaCreation#typeToSql` sources type names from the adapter's
      `nativeDatabaseTypes()` in Rails' casing rather than hardcoding uppercase
      literals.
- [ ] `test_create_table_with_bigint` is ported into
      `packages/activerecord/src/migration/change-schema.test.ts` and passes.
- [ ] Schema-dumper snapshots re-baselined where the casing legitimately
      changed; no unexplained diffs.
- [ ] Green on all three lanes.
