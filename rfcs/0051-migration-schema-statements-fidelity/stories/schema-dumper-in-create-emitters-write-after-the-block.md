---
title: "indexes/exclusion/unique in-create emitters write after the createTable block, not inside it"
status: ready
updated: 2026-08-27
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SchemaDumper#table` emits indexes and the three constraint families
INSIDE the `create_table` block, on the `t` builder the block yields
(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:209-212`):

```ruby
indexes_in_create(table, tbl)
remaining = check_constraints_in_create(table, tbl) if @connection.supports_check_constraints?
exclusion_constraints_in_create(table, tbl) if @connection.supports_exclusion_constraints?
unique_constraints_in_create(table, tbl) if @connection.supports_unique_constraints?

tbl.puts "  end"
```

trails emits three of those four AFTER the block closes, as `ctx.addIndex(...)`
/ `ctx.addExclusionConstraint(...)` / `ctx.addUniqueConstraint(...)` calls
(`packages/activerecord/src/schema-dumper.ts`, `table()`), because the DSL
exposes them on `ctx` and not on the `TableDefinition` the `createTable`
callback receives. Only `checkConstraintsInCreate`'s valid arm emits inline, as
`t.checkConstraint(...)`.

PR #7094 inlined `table()`'s column half and retired `emitTable`, so the CALLS
are now made from `table()` in Rails' order — the calls write into their own
buffers and only the emission point moves. This story is the remaining half:
the emission point itself.

## Converged shape

Give the `TableDefinition` handed to the `createTable` callback the `index`,
`exclusionConstraint` and `uniqueConstraint` members Rails' block builder has
(`connection_adapters/abstract/schema_definitions.rb`), so all four in-create
emitters write `t.*` lines inside the block, and `table()` no longer needs the
`indexLines` / `constraintLines` side buffers or the ordering commentary that
explains them.

Note this changes dumped schema files, so the canonical schema fixtures and the
`schema-dumper.test.ts` / per-dialect expectations move with it.

## Acceptance criteria

- `indexesInCreate`, `exclusionConstraintsInCreate` and
  `uniqueConstraintsInCreate` emit inside the `createTable` block, on `t`,
  matching `schema_dumper.rb:209-212`.
- The `indexLines` / `constraintLines` buffers in `table()` are gone; the
  emitters write straight into `tbl` as Rails writes into its own.
- Dumped output round-trips: a dump loaded back through the DSL rebuilds the
  same schema on SQLite, PostgreSQL and MySQL.
