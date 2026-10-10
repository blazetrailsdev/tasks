---
title: "activerecord: an optional positional before trailing options or a block is told apart with a typeof arm"
status: ready
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby tells an optional positional argument from trailing keywords or a block by syntax. Three ports
tell them apart with a `typeof` arm Rails does not have, each carrying
`@inventedArm if — CONVERGEABLE` against this story:

- `removeForeignKey(fromTable, toTable?, options)` in
  `packages/activerecord/src/connection-adapters/sqlite3/schema-statements.ts`, against
  `def remove_foreign_key(from_table, to_table = nil, **options)`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb:83`).
  It opens with `if (typeof toTable === "object" && toTable !== null)`.
- `removeCheckConstraint(tableName, expression?, options)` in the same file, against
  `def remove_check_constraint(table_name, expression = nil, if_exists: false, **options)`
  (`sqlite3/schema_statements.rb:129`). It reads `expression` as either the expression or the options.
- `withExampleTable(connection, tableName, definitionOrFn, maybeFn)` in
  `packages/activerecord/src/support/ddl-helper.ts`, against
  `def with_example_table(connection, table_name, definition = nil)`
  (`vendor/rails/v8.0.2/activerecord/test/support/ddl_helper.rb:4`).

The abstract adapter's `removeForeignKey` and `removeCheckConstraint`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`) carry the same arm with
no receipt, because class methods were already compared when the top-level pass ran.

## Acceptance criteria

- [ ] One shape is chosen for "optional positional, then options or block" and written down where the
      kwargs idiom is recorded.
- [ ] The five ports above take it, their callers are updated, and the three receipts are deleted.
- [ ] `pnpm parity:api:arms:throws` green with no stale receipt.
