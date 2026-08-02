---
title: "SQLite adapter's private typeToSql shadows SchemaStatements#typeToSql"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5570
claim: "2026-08-02T00:41:05Z"
assignee: "sqlite-private-typetosql-shadows-schema-statements"
blocked-by: null
closed-reason: null
---

## Context

`sqlite3-adapter.ts` declares a **private** `typeToSql`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1957`) that
shadows the public `SchemaStatements#typeToSql`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1555`)
on the adapter instance. It uppercases the type and then rejects anything that
is not a bare identifier:

```ts
const raw = this.nativeDatabaseTypes()[type]?.name ?? type.toUpperCase();
if (!/^[A-Za-z_][A-Za-z0-9_ ]*$/.test(raw)) throw new Error(`Invalid SQL type: ${raw}`);
```

Rails' `type_to_sql` returns an unrecognized type **verbatim** (`type.to_s`,
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1414-1415`),
which our own `SchemaCreation#typeToSql` default branch already does correctly.
So `connection.type_to_sql("datetime(6)")` — which Rails tests call directly —
throws `Invalid SQL type: DATETIME(6)` on the SQLite lane instead of returning
`"datetime(6)"`.

Surfaced by PR #5558, which had to leave three cases unported:
`test_add_column_with_timestamp_type` (`change_schema_test.rb:267-283`),
`test_add_column_with_postgresql_datetime_type` (:285-301) and
`test_change_column_with_timestamp_type` (:318-336) — all three assert
`column.sql_type == connection.type_to_sql("datetime(6)")`.

Note both sides must agree: the DDL the adapter emits for `t.column :foo,
:timestamp` and the value `type_to_sql` returns. Fixing only the shadow without
reconciling the emitted DDL will not make the tests pass.

## Acceptance criteria

- [ ] The private `typeToSql` shadow is removed or renamed so the public
      `SchemaStatements#typeToSql` is reachable on a SQLite connection.
- [ ] `connection.typeToSql("datetime(6)")` returns the type verbatim, matching
      `schema_statements.rb:1414-1415`.
- [ ] The three cases above are ported into
      `packages/activerecord/src/migration/change-schema.test.ts` and pass.
- [ ] No regression in the schema-dumper snapshots.
- [ ] Green on all three lanes.
