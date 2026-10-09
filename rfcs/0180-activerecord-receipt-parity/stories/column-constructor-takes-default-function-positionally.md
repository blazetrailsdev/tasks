---
title: "activerecord: Column#initialize takes default_function as its fifth positional parameter"
status: draft
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `sqlite3-new-column-from-field-is-this-typed-with-raw-reads`, which converged
`SQLite3::SchemaStatements#new_column_from_field`'s reads and left its `Column.new` argument list,
because the constructor's own signature forces it.

`ConnectionAdapters::Column#initialize`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/column.rb:20`) is
`initialize(name, default, sql_type_metadata = nil, null = true, default_function = nil, collation: nil, comment: nil, **)`:
`default_function` is the fifth positional parameter, and `collation:` / `comment:` are kwargs.
`SQLite3::Column#initialize`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/column.rb:9`) is
`initialize(*, auto_increment: nil, rowid: false, generated_type: nil, **)` and forwards with `super`.

`packages/activerecord/src/connection-adapters/column.ts`'s constructor takes four positionals and
an options object that carries `defaultFunction` beside `collation` and `comment`, defaulting it with
`options.defaultFunction ?? null`. `packages/activerecord/src/connection-adapters/sqlite3/column.ts`
repeats that shape, re-wraps `sqlTypeMetadata` in a new `SqlTypeMetadata`, and defaults
`autoIncrement ?? false` where Rails stores `nil`. So
`packages/activerecord/src/connection-adapters/sqlite3/schema-statements.ts` `newColumnFromField`
passes `defaultFunction` inside the options object where Rails passes it positionally
(`sqlite3/schema_statements.rb:158-168`), and the MySQL and PostgreSQL `new_column_from_field`
ports (`mysql/schema-statements.ts`, `postgresql/schema-statements.ts`) do the same.

## Acceptance criteria

- [ ] `Column`'s constructor takes `defaultFunction` as its fifth positional parameter, with
      `collation` / `comment` in the trailing options object; the SQLite3, MySQL and PostgreSQL
      `Column` subclasses forward it as Rails' `super` does.
- [ ] Every `new Column(...)` / `Column.new(...)` call site passes `default_function` where its
      Rails counterpart does, the three `new_column_from_field` ports included.
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:params` green with no new row; the
      column-reflection tests pass on all three adapters.

## Verification

```bash
pnpm parity:api:calls:args && pnpm parity:api:params && pnpm vitest run packages/activerecord/src/column-definition.test.ts
```
