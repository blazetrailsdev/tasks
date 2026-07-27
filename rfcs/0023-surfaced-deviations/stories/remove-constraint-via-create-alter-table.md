---
title: "removeConstraint builds a bare AlterTable instead of create_alter_table"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while routing PG constraint removal through `removeConstraint` (#5383).

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`
`removeConstraint` builds its node with a bare `new AlterTable(tableName)`,
but Rails uses the `create_alter_table` factory
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1348-1353`):

```ruby
def remove_constraint(table_name, constraint_name) # :nodoc:
  at = create_alter_table(table_name)
  at.drop_constraint(constraint_name)

  execute schema_creation.accept(at)
end
```

That factory is what attaches the adapter-specific `AlterTable` subclass and its
`TableDefinition`. Going through the bare constructor yields an abstract node
with no TableDefinition, so any PG-specific arm the visitor reads off the
subclass is silently skipped. It happens to work today because `dropConstraint`
only needs the name, and PG's `visitAlterTable` guards its extra arms with
`Array.isArray`.

## Acceptance criteria

- `removeConstraint` builds via `createAlterTable(tableName)`, matching Rails.
- The `AlterTable` import in that file drops out if it becomes unused.
- `pnpm api:calls:wide` does not regress; the `remove_constraint` /
  `create_alter_table` pair should drop out of the baseline if flagged.
