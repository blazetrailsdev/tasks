---
title: "Converge PG buildChangeColumnDefinition to route through createTableDefinition().newColumnDefinition"
status: claimed
updated: 2026-06-22
rfc: "0026-adapter-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 20
pr: null
claim: "2026-06-22T17:47:59Z"
assignee: "converge-pg-build-change-column-definition-via-table-definition"
blocked-by: null
---

## Context

Surfaced during #3354 (converge-pg-alter-table-clear-cache). The PG
`buildChangeColumnDefinition` in
`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`
constructs `new ColumnDefinition(columnName, type, options)` directly and
discards the `tableName` argument (`void tableName`):

```ts
buildChangeColumnDefinition(tableName, columnName, type, options = {}) {
  void tableName;
  const cd = new ColumnDefinition(columnName, type as ColumnType, options);
  cd.sqlType = this.typeToSql(type, options);
  return new ChangeColumnDefinition(cd, columnName);
}
```

Rails' `PostgreSQL::SchemaStatements#build_change_column_definition`
(`postgresql/schema_statements.rb:477`) instead routes through the table
definition:

```ruby
def build_change_column_definition(table_name, column_name, type, **options)
  td = create_table_definition(table_name)
  cd = td.new_column_definition(column_name, type, **options)
  ChangeColumnDefinition.new(cd, column_name)
end
```

`new_column_definition` applies PG-specific column normalization (e.g. the
datetime/timestamp precision default, virtual/generated `as:`/`stored:`
handling, aliased types) that the direct-construction path skips. This was
left out of #3354 because it is not one of that story's 9 listed items and is
shared with the bulk `change_table` path (`changeColumnForAlter`), so changing
it risks behavior shifts that need their own verification.

## Acceptance criteria

- [ ] PG `buildChangeColumnDefinition` builds its `ColumnDefinition` via
      `this.createTableDefinition(tableName).newColumnDefinition(columnName, type, options)`,
      mirroring Rails, rather than constructing `ColumnDefinition` directly.
- [ ] `changeColumn` and the bulk `change_table` / `changeColumnForAlter`
      paths still emit the same (or more Rails-faithful) DDL; verify against
      `change_schema_test.rb` cast/precision/array cases.
- [ ] CI green on all three adapters.
