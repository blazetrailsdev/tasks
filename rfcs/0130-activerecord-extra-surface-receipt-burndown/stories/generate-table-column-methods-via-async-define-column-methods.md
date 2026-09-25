---
title: "generate-table-column-methods-via-async-define-column-methods"
status: ready
updated: 2026-09-25
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Table` includes the same `ColumnMethods` as `TableDefinition`
(`activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:715-716`,
`postgresql/schema_definitions.rb:304`, `mysql/schema_definitions.rb:102`), so its
column methods (`t.string`, `t.bigserial`, `t.unsigned_float`, …) come from
`define_column_methods` (`schema_definitions.rb:332-341`), and the `alias :blob :binary` /
`alias :numeric :decimal` (`:328`).

trails generates only the `TableDefinition` side (trails#8061). abstract/PG/MySQL `Table`
still hand-write every column method as `async`, routing through the invented
`Table#definedColumn` (`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`).
They are async because `Table#column` awaits `add_column` (`:730-737`). The
synchronous `TableDefinition.defineColumnMethods` body therefore cannot be shared
as-is.

A prototype conversion was done on trails#8061 and then backed out to stay under the
LOC ceiling. It adds `static defineColumnMethods` to `Table` with the Rails body, but
with `await this.column(...)` per name, so the body is `async function (...names)`.
It merges `interface Table extends ColumnMethods {}` per adapter, calls
`Table.defineColumnMethods(<Rails list>)` in each file (plus the abstract
`Table.prototype.blob = Table.prototype.binary` / `numeric` aliases), and applies
`deprecate.call(Table, "unsignedFloat", "unsignedDecimal", { deprecator: deprecator() })`
for MySQL (`mysql/schema_definitions.rb:50`). With that change, typecheck and the sqlite
migration/change_table suites stayed green. The api-compare extractor already credits
`X.defineColumnMethods(...)` members (the `collectDefineColumnMethodsMembers` arm from
trails#8061).

## Acceptance criteria

- abstract, PostgreSQL and MySQL `Table` generate their column methods via an async
  `Table.defineColumnMethods` with Rails' lists; the hand-written methods and
  `Table#definedColumn` are deleted.
- MySQL `Table#unsignedFloat` / `#unsignedDecimal` warn through `deprecate`, not inline
  `deprecator().warn`. The invented `UNSIGNED_*_DEPRECATION` message constants are
  deleted, and `unsigned-type.test.ts` passes the deprecator only
  (`unsigned_type_test.rb:59-68`).
- `pnpm parity:api:extra:gate`, `pnpm parity:api:calls` stay green; the three
  `schema_definitions.rb` files stay at 100% in `parity:api`.
