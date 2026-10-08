---
title: "activerecord: SchemaDumper#table reads table_options off @connection; the dumper has no tableOptions method"
status: ready
updated: 2026-10-08
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8668, which typed `PostgreSQL::SchemaDumper`'s connection reads and left this shape alone.

Rails' `SchemaDumper#table` reads the adapter's table options directly
(`vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb:187-190`):

```ruby
table_options = @connection.table_options(table)
if table_options.present?
  tbl.print ", #{format_options(table_options)}"
end
```

There is no `table_options` method on the dumper, in the base class or in any adapter's subclass.

trails has one on all three:

- `packages/activerecord/src/schema-dumper.ts` declares a protected `tableOptions(_tableName)` that answers `Promise.resolve({})`, and `table` calls `this.tableOptions(table)`.
- `packages/activerecord/src/connection-adapters/postgresql/schema-dumper.ts` overrides it with `return this.connection!.tableOptions(tableName)`.
- `packages/activerecord/src/connection-adapters/mysql/schema-dumper.ts` overrides it with `if (!this.connection) return {}; return this.connection.tableOptions(tableName)`.

The indirection exists because the base dumper accepts a `SchemaSource` that is not an adapter (`_source`, `_adapter(): any`). The members are `protected`, so `parity:api:extra` does not count them.

## Acceptance criteria

- [ ] `SchemaDumper#table` reads `tableOptions` off its connection where Rails does (`schema_dumper.rb:187`), followed by the `present?` check.
- [ ] The `tableOptions` method is deleted from the base dumper and from the PostgreSQL and MySQL dumpers, including MySQL's `if (!this.connection)` guard.
- [ ] Test fakes that build a dumper over a non-adapter source supply `tableOptions`, as the PostgreSQL trails test's fake already does.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra:gate` are green; the schema-dumper tests pass on all three lanes.
