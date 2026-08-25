---
title: "change-table-bulk-paths-use-real-command-recorder"
status: done
updated: 2026-07-30
rfc: "0005-activerecord-gaps"
cluster: null
deps:
  - change-table-recorder-and-adapter-direct-yield-adapter-table
deps-rfc: []
est-loc: null
priority: null
pr: 5635
claim: "2026-07-30T13:12:29Z"
assignee: "change-table-bulk-paths-use-real-command-recorder"
blocked-by: null
closed-reason: null
---

## Context

Split out of `change-table-recorder-and-adapter-direct-yield-adapter-table`
(PR #5628), which converged the object `change_table` yields on all three entry
points but left the **bulk** paths on their trails shapes.

Two divergences remain, both on `bulk: true`:

1. **`SchemaStatements#changeTable`** builds an ad-hoc `Proxy` as the recorder
   (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1031-1058`),
   pushing `[name, ...args]` tuples into an `ops` array and forwarding
   read-only predicates (`columnExists`, `indexExists`, …) to the real
   SchemaStatements. Rails instantiates the real recorder:

   ```ruby
   recorder = ActiveRecord::Migration::CommandRecorder.new(self)
   yield update_table_definition(table_name, recorder)
   bulk_change_table(table_name, recorder.commands)
   ```

   (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:511-514`).
   `CommandRecorder` now has the generated `ReversibleAndIrreversibleMethods`
   bodies (added by #5628), so it can stand in directly — but
   `bulkChangeTable` consumes the `[name, ...args]` tuple shape, not
   `{ cmd, args }`, and the predicate forwarding has no Rails counterpart
   (Rails' recorder simply doesn't answer them), so both need reconciling.

2. **`CommandRecorder#changeTable`'s bulk branch**
   (`packages/activerecord/src/migration/command-recorder.ts:120-131`) omits
   Rails' `recorder.reverting = @reverting` and records the parent entry with
   `record("changeTable", [tableName, sub.commands])` instead of Rails'
   raw `@commands << [:change_table, [table_name], -> t { bulk_change_table(...) }]`
   (`vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb:137-143`).

   The two produce the same output by different routes: Rails inverts inside
   the sub-recorder and appends the parent entry un-inverted; trails keeps the
   sub-recorder raw and lets `invertChangeTable` flip the stored sub-list.
   Converging means the command list has to carry a **callable** third element,
   which trails' `{ cmd, args }` shape and `replay()` do not support — and
   `invertChangeTable` (which Rails does not have at all) becomes dead.

## Acceptance criteria

- `SchemaStatements#changeTable`'s bulk branch instantiates
  `CommandRecorder.new(this)` and passes `recorder.commands` to
  `bulkChangeTable`; the ad-hoc `Proxy` and its `predicates` set are deleted.
  Either `bulkChangeTable` accepts `{ cmd, args }` or the recorder's commands
  are adapted at the call site — whichever keeps `migration/change-table.test.ts`
  and the MySQL bulk-alter coverage green.
- `CommandRecorder#changeTable` propagates `reverting` to the sub-recorder and
  stores the parent entry Rails' way, or the deviation is justified in a
  comment at the call site if the callable-command shape is judged out of
  scope on its own.
- `migration/change-table.test.ts`'s bulk tests and
  `command-recorder.test.ts`'s "bulk invert change table" stay green on
  sqlite3, PostgreSQL and MySQL (MySQL is the only adapter where
  `supportsBulkAlter?` is true, so it is the one that exercises the DDL).
- `parity:api` / `parity:test` deltas non-negative.
