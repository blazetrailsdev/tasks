---
title: "rename-column-for-alter-fallback-arm-is-a-rewrite"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6228
claim: "2026-08-08T10:39:59Z"
assignee: "rename-column-for-alter-fallback-arm-is-a-rewrite"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `rename-column-for-alter-hand-warms-database-version`
(PR #6146), which converged only the FIRST branch of
`AbstractMysqlAdapter#renameColumnForAlter` — dropping the `getDatabaseVersion()`
hand-warm and returning `this.renameColumnSql(...)` as Rails does. The
pre-8.0.3 / MariaDB <10.5.2 CHANGE fallback below it is still a rewrite rather
than a port.

Rails (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:863-878`):

```ruby
def rename_column_for_alter(table_name, column_name, new_column_name)
  return rename_column_sql(table_name, column_name, new_column_name) if supports_rename_column?

  column  = column_for(table_name, column_name)
  options = { default: column.default, null: column.null,
              auto_increment: column.auto_increment?, comment: column.comment }

  current_type = internal_exec_query("SHOW COLUMNS FROM #{quote_table_name(table_name)} LIKE #{quote(column_name)}", "SCHEMA").first["Type"]
  td = create_table_definition(table_name)
  cd = td.new_column_definition(new_column_name, current_type, **options)
  schema_creation.accept(ChangeColumnDefinition.new(cd, column.name))
end
```

trails (`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:1820-1872`)
diverges on every line of that arm:

- Reads `column.sqlType` instead of the `SHOW COLUMNS ... LIKE` round-trip for
  `current_type`. This is why `internal_exec_query`, `quote`, `quote_table_name`
  and `first` are all baselined for this method.
- Never calls `create_table_definition` / `new_column_definition`; constructs
  `new ColumnDefinition(...)` directly, so `create_table_definition` is baselined
  too.
- Passes `collation` and `onUpdate` options Rails does not pass.
- Passes `columnName` as `ChangeColumnDefinition`'s second argument where Rails
  passes `column.name`.
- Adds two invented `throw` sites with no Rails counterpart: a virtual/generated
  column guard and a missing-`sqlType` guard.

Five `call-mismatches-exclude` rows for `rename_column_for_alter`
(`create_table_definition`, `first`, `internal_exec_query`, `quote`,
`quote_table_name`) in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract-mysql-adapter.json`
all encode this one divergence and should retire together.

Not folded into #6146 because the invented shape is load-bearing for ~15 tests
in `connection-adapters/abstract-mysql-adapter.test.ts`
(`describe("AbstractMysqlAdapter#renameColumnForAlter fallback")`, :76-240),
which assert the virtual-column throw, the `onUpdate` slot and the `collation`
slot. Converging the body means retiring or rewriting those against the Rails
shape, which is its own diff.

## Acceptance criteria

- [ ] The fallback arm reads `current_type` from the `SHOW COLUMNS FROM ... LIKE ...`
      query with the `"SCHEMA"` name, as Rails does.
- [ ] It routes through `createTableDefinition` + `newColumnDefinition` rather
      than constructing `ColumnDefinition` directly.
- [ ] The options hash carries exactly Rails' four keys (`default`, `null`,
      `autoIncrement`, `comment`); `collation`/`onUpdate` go or are cited as
      language-forced at the call site.
- [ ] `ChangeColumnDefinition`'s second argument is `column.name`.
- [ ] The two invented `throw` sites are removed, or each carries a
      `@noRailsEquivalent` with the reason at the raise site.
- [ ] The five `rename_column_for_alter` rows above are deleted from the
      call-mismatch baseline by hand (via `serializeBaseline`, never `--write`).
- [ ] The trails-only fallback tests are converged onto the Rails shape or
      retired; MySQL/MariaDB lanes green including the pre-8.0.3 CHANGE path.
