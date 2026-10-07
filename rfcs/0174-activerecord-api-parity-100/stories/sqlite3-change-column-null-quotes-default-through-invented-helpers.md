---
title: "SQLite3Adapter#change_column_null calls quote(default) under Rails' guard, not quoteDefault / serializeDefaultForColumn"
status: draft
updated: 2026-10-07
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLite3Adapter#change_column_null` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:374-383`):

```ruby
validate_change_column_null_argument!(null)

unless null || default.nil?
  internal_exec_query("UPDATE #{quote_table_name(table_name)} SET #{quote_column_name(column_name)}=#{quote(default)} WHERE #{quote_column_name(column_name)} IS NULL")
end
alter_table(table_name) do |definition|
  definition[column_name].null = null
end
```

trails' `changeColumnNull` in `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` deviates, seen while working trails PR 8642:

- It quotes the default through two private helpers Rails does not have, `serializeDefaultForColumn` (which also runs an extra `this.columns(tableName)` query) and `quoteDefault` (a hand-rolled literal quoter with number / boolean / function / Date / `toSql` arms), where Rails calls `quote(default)`.
- The guard is `!null_ && default_ !== undefined`, so an explicit `null` default runs the UPDATE; Rails' `unless null || default.nil?` skips it.
- `default` is declared `default_?: unknown` where Rails has `default = nil`.
- The SQL is `SET col = val`; Rails emits `SET col=val`.
- It calls the module functions `quoteTableName` / `quoteColumnName` rather than the adapter's own.

## Acceptance criteria

- [ ] `changeColumnNull` is line-for-line with `sqlite3_adapter.rb:374-383`: `default = null`, the `unless null || default.nil?` guard, `this.quote(default)`, and Rails' SQL text.
- [ ] `quoteDefault` and `serializeDefaultForColumn` are deleted if nothing else calls them; if a test depends on the structured-default serialization, the behaviour moves to where Rails has it (`quote` / the type's `serialize`), not a private helper.
- [ ] `pnpm parity:api:calls` and `parity:api:calls:args` stay green; the SQLite migration tests covering `change_column_null` stay green.
