---
title: "MySQL schemaCollation reads a tableOptions-prefilled cache, forcing table() to call tableOptions early"
status: done
updated: 2026-08-27
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7127
claim: "2026-08-27T18:13:52Z"
assignee: "group-model-ts-remaining-inline-mixin-literals-into-module-objects"
blocked-by: null
closed-reason: null
---

## Context

Rails' MySQL `schema_collation` fetches the table collation lazily, inside its
own body, the first time a column asks for it
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_dumper.rb:66-71`):

```ruby
def schema_collation(column)
  if column.collation
    @table_collation_cache ||= {}
    @table_collation_cache[table_name] ||=
      @connection.internal_exec_query("SHOW TABLE STATUS LIKE #{@connection.quote(table_name)}", "SCHEMA").first["Collation"]
    column.collation.inspect if column.collation != @table_collation_cache[table_name]
  end
end
```

That query is async in trails and `schemaCollation`
(`packages/activerecord/src/connection-adapters/mysql/schema-dumper.ts:285-293`)
is sync, so the port reads a `tableCollationCache` that someone else prefills.
The only prefiller is MySQL's `tableOptions` override
(`mysql/schema-dumper.ts:77-86`, and its `populateTableCollationFromStatus`
fallback), which forces `SchemaDumper#table` to call `tableOptions` BEFORE the
column-spec chain.

Rails calls `@connection.table_options(table)` at
`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:187`, AFTER
`column_spec_for_primary_key` (`:173`). PR #7094 first moved the port to Rails'
position and reddened `PrimaryKeyAnyTypeTest > schema dump primary key includes
type and options` on MariaDB: the primary key compared its collation against a
cold cache and dumped `collation: "utf8mb4_unicode_ci"` where Rails emits none.
The read was moved back ahead of the spec chain, and the resulting call-order
inversion is baselined at
`scripts/api-compare/call-mismatches-exclude/activerecord/schema-dumper.json`
(`order:tableOptions,removePrefixAndSuffix`).

## Converged shape

`schemaCollation` should get the table collation without `tableOptions` having
run — so `table()` can call `tableOptions` where Rails calls it, at Rails'
`:187` position, and the baseline row goes away by deletion.

The prefill has to happen at some async point above the sync spec chain. The
two candidates worth weighing:

- warm `tableCollationCache` from MySQL's column reflection, so it is filled by
  the same `columns(table)` read the dumper already awaits at
  `schema_dumper.rb:158`; or
- give the dumper a single adapter-prefetch point at the top of `table()`
  alongside the existing `supportsVirtualColumns` / `primaryKeys` reads — note
  this is a new base seam with no Rails counterpart, so it needs to be weighed
  against the baseline row it retires rather than assumed better.

## Acceptance criteria

- `SchemaDumper#table` calls `tableOptions` at Rails' `schema_dumper.rb:187`
  position, after `columnSpecForPrimaryKey`.
- MySQL's `schemaCollation` still suppresses a column collation equal to the
  table collation, for the primary key column as well as ordinary columns.
- The `order:tableOptions,removePrefixAndSuffix` row is deleted from
  `scripts/api-compare/call-mismatches-exclude/activerecord/schema-dumper.json`,
  with `pnpm parity:api:calls:tighten activerecord/schema-dumper.json` for the
  shard.
- `PrimaryKeyAnyTypeTest > schema dump primary key includes type and options`
  stays green on MySQL/MariaDB (it is the regression that pins this).
