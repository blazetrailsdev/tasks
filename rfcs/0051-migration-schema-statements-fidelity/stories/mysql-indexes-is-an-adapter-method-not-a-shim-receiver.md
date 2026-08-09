---
title: "MySQL indexes runs on the adapter, not a hand-built IndexesHost shim"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6300
claim: "2026-08-09T20:59:21Z"
assignee: "adapter-class-sync-swallows-the-pool-error-rails-raises"
blocked-by: null
closed-reason: null
---

## Context

`Mysql2Adapter#indexes`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:1471-1479`)
calls the ported `indexes` with a hand-built shim object rather than `this`:

```ts
return mysqlIndexes.call(
  { schemaQuery: ..., quoteTableName: ..., addOptionsForIndexColumns: ... },
  tableName,
);
```

Rails' `MySQL::SchemaStatements#indexes`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:40-75`)
is a module method mixed into the adapter, so `self` IS the adapter and every
call inside the body (`internal_exec_query`, `quote_table_name`,
`add_options_for_index_columns`) dispatches polymorphically. The shim freezes
that list: each new call the body needs has to be threaded by hand, which is
exactly what PR #6282 had to do when `add_options_for_index_columns` replaced
the `supports_index_sort_order?` flag.

## Converged shape

`indexes` becomes a method on `MysqlSchemaStatements` (the class already mixed
into `AbstractMysqlAdapter` via `include`), the `IndexesHost` interface goes
away, and `Mysql2Adapter` inherits it — no `.call` with a synthetic receiver.
The existing `indexes:` unit tests already build their host as
`Object.create(MysqlSchemaStatements.prototype)`, so they carry over.

## Acceptance criteria

- [ ] `indexes` is a `MysqlSchemaStatements` member, not a module-level
      `this`-typed function invoked through a shim.
- [ ] `Mysql2Adapter` has no `indexes` override that rebuilds a receiver.
- [ ] `IndexesHost` is deleted.
