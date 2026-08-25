---
title: "Retire arel_column_with_table's schema-qualified guard so the body is Rails' two arms"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6617
claim: "2026-08-16T23:00:00Z"
assignee: "converge-arel-column-with-table-schema-qualified-guard"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #6611 while converging `references_values` to `Arel::Nodes::SqlLiteral`.

`arel_column_with_table` (activerecord/lib/active_record/relation/query_methods.rb:1978-1987)
has exactly two arms after seeding the reference:

```ruby
if column_name.is_a?(Symbol) || !column_name.match?(/\W/)
  predicate_builder.resolve_arel_attribute(table_name, column_name) { ... }
else
  Arel.sql("#{model.adapter_class.quote_table_name(table_name)}.#{column_name}")
end
```

trails (`packages/activerecord/src/relation/query-methods.ts`, `arelColumnWithTable`)
keeps a THIRD arm ahead of those two, for a dotted `table_name`:

```ts
if (tableName.includes(".")) {
  return Arel.sql(`${quoteTableName(tableName)}.${quoteColumnName(columnName)}`);
}
```

The reason it exists: a schema-qualified name handed to `ArelTable` is quoted as one
identifier (`"schema.table"."col"`) instead of two. Rails does not need the guard because
`resolve_arel_attribute` reaches the same adapter quoting through the table's own
`type_caster`/`arel_table`.

This is the last live row in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation/query-methods.json`
for this body: `arel_column_with_table` / `order:quoteTableName,resolveArelAttribute`.
The row exists only because this guard puts `quoteTableName` ahead of
`resolveArelAttribute`.

## Converged shape

Delete the dotted-`table_name` arm so the body is Rails' two arms in Rails' order, and
fix schema-qualified quoting where Rails fixes it — in the Arel table/attribute path, so
`Arel::Table.new("schema.table")` (or the predicate builder's `resolve_arel_attribute`)
quotes each segment. Then delete the baseline row by hand and
`pnpm parity:api:calls:tighten activerecord/relation/query-methods.json`.

## Acceptance criteria

- [ ] `arelColumnWithTable` is query_methods.rb:1978-1987 — reference seed, then the
      Symbol/`\W` discriminant, then the `quote_table_name` fallback; no extra branch.
- [ ] A schema-qualified `table.column` still emits `"schema"."table"."col"` (regression
      test covering the arm being removed, failing on the converged body without the
      Arel-side fix).
- [ ] The `arel_column_with_table` `order:quoteTableName,resolveArelAttribute` row is
      deleted from its shard; mark tightened, no reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; SQLite, PostgreSQL, MySQL/MariaDB lanes green.
