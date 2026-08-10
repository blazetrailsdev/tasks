---
title: "PG/MySQL changeColumnForAlter still takes Record<string, unknown> and returns unknown[]"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6182
claim: "2026-08-07T17:05:48Z"
assignee: "activemodel-time-readers-take-rational-sec-fraction-value"
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQLAdapter.changeColumnForAlter`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:4370`)
is the last of the widened PG schema-statement overrides surfaced by PR #6164
and left unconverged by PR #6170, which converged `addColumnForAlter` and
`addIndexOptions`:

```ts
async changeColumnForAlter(
  tableName: string,
  columnName: string,
  type: string,
  options: Record<string, unknown> = {},
): Promise<unknown[]>
```

Rails is `postgresql/schema_statements.rb:1050-1055`:

```ruby
def change_column_for_alter(table_name, column_name, type, **options)
  change_col_def = build_change_column_definition(table_name, column_name, type, **options)
  sqls = [schema_creation.accept(change_col_def)]
  sqls << Proc.new { change_column_comment(table_name, column_name, options[:comment]) } if options.key?(:comment)
  sqls
end
```

`type: string` should be `ColumnType` and `options: Record<string, unknown>`
should be `ColumnOptions` (the body already casts the options bag back to
`Parameters<typeof this.buildChangeColumnDefinition>[3]` to call
`buildChangeColumnDefinition`, which is exactly the smell the widening hides).
The `Promise<unknown[]>` return should be
`Promise<Array<string | (() => Promise<void>)>>` — the same shape PR #6170 gave
`addColumnForAlter`, whose union is `string | [string, () => Promise<void>]`.

Note `changeColumnForAlter` is not declared on `AbstractAdapter` and has no
abstract counterpart in `abstract/schema-statements.ts`, so unlike
`addColumnForAlter` there is no base signature to merge against — Rails has it
only on the PG and MySQL adapters (`abstract_mysql_adapter.rb`, ported at
`connection-adapters/abstract-mysql-adapter.ts:1770`, which carries the same
widening). Converge both, or converge PG and file MySQL separately.

## Acceptance criteria

- [ ] `PostgreSQLAdapter.changeColumnForAlter` takes `ColumnType` / `ColumnOptions`
      and returns the sql-or-proc union rather than `unknown[]`.
- [ ] The internal cast to `buildChangeColumnDefinition`'s parameter type is gone
      (the options type now flows).
- [ ] `AbstractMysqlAdapter.changeColumnForAlter` converged the same way, or a
      sibling story filed for it.
- [ ] `pnpm typecheck` green, `parity:api:extra --package activerecord` delta
      non-negative, PG and MySQL lanes green.
