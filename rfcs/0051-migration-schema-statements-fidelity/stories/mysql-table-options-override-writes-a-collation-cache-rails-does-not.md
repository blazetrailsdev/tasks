---
title: "mysql-table-options-override-writes-a-collation-cache-rails-does-not"
status: done
updated: 2026-08-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 7161
claim: "2026-08-28T14:07:26Z"
assignee: "db-schema-load-sql-reports-success-for-memory-noop"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `mysql-schema-collation-cache-forces-early-tableoptions`
(PR #7127), which moved `SchemaDumper#table`'s `tableOptions` call to Rails'
position (`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:187`) and
made MySQL's `table()` override prefetch the table collation from
`SHOW TABLE STATUS`, mirroring `mysql/schema_dumper.rb:66-71`'s lazy fetch.

That leaves a now-redundant second prefill in MySQL's `tableOptions` override
(`packages/activerecord/src/connection-adapters/mysql/schema-dumper.ts:77-86`):

```ts
const opts = await this.connection.tableOptions(tableName);
if (Object.hasOwn(opts, "collation")) {
  this.tableCollationCache[tableName] = opts["collation"];
} else {
  await this.populateTableCollationFromStatus(tableName);
}
return opts;
```

Rails' `MySQL::SchemaDumper#table_options` has no counterpart for either arm —
it does not touch a collation cache at all
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_dumper.rb`
defines only `prepare_column_options`, `schema_type`, `schema_precision`,
`schema_collation` and `extract_expression_for_virtual_column`; the options
themselves come from `AbstractMysqlAdapter#table_options`,
`abstract_mysql_adapter.rb:139-153`, which parses `SHOW CREATE TABLE`). Both
arms are now dead: `table()` fills the cache before `super.table()` runs, and
`populateTableCollationFromStatus` early-returns on `Object.hasOwn`.

## Converged shape

Delete the cache-writing arms from the `tableOptions` override so it is the
plain options read Rails' dumper makes, leaving `table()`'s prefetch as the one
writer of `tableCollationCache`. If the override then does nothing but delegate,
delete the override too.

Two trails-only tests in
`packages/activerecord/src/connection-adapters/mysql/schema-dumper.trails.test.ts`
pin the removed arms ("populates tableCollationCache when collation is present",
"does not populate tableCollationCache when no collation in options") and go
with them; the behaviour that must stay pinned is `schemaCollation` suppressing
a column collation equal to the table collation, which its own tests cover.

## Acceptance criteria

- [ ] MySQL's `tableOptions` override writes no collation cache (or is gone).
- [ ] `PrimaryKeyAnyTypeTest > schema dump primary key includes type and options`
      and the `schemaCollation` tests stay green on MySQL/MariaDB — the pk column
      still compares against a warm cache.
- [ ] `parity:api:calls` / `:args` clean; no new baseline row.
