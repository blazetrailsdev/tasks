---
title: "remove_column's arity ArgumentError is hand-mirrored in two adapters"
status: draft
updated: 2026-07-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`remove_column`'s second parameter is required in Ruby
(`def remove_column(table_name, column_name, type = nil, **options)`,
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:684-700`),
so `connection.remove_column("funny")` raises an arity `ArgumentError` before
any DDL runs. `test_remove_column_no_second_parameter_raises_exception`
(`columns_test.rb:324-326`) asserts exactly that.

TypeScript enforces no arity at runtime, so PR #5571 mirrored the raise by hand
in two places, with a message copied from Ruby's arity error:

```ts
if (columnName === undefined) {
  throw new ArgumentError("wrong number of arguments (given 1, expected 2..3)");
}
```

— once in `abstract/schema-statements.ts` `SchemaStatements#removeColumn` and
once in `sqlite3-adapter.ts` `removeColumn` (which overrides the base and would
otherwise reach `alterTable("funny")` and raise `StatementInvalid: Could not
find table 'funny'` instead).

This is invented code with no corresponding Rails line, duplicated across two
files, and the hard-coded `2..3` will drift if either signature gains a
parameter. Worth deciding on a single mechanism: either one shared arity guard
that both call, or a general approach for the other required-parameter methods
that have the same gap (`rename_column`, `change_column`, `add_column` all take
required arguments that TypeScript will happily accept as `undefined`).

## Acceptance criteria

- [ ] One mechanism for the arity mirror rather than two hand-copied throws,
      with the expected-arity range derived rather than hard-coded if practical.
- [ ] `test_remove_column_no_second_parameter_raises_exception` still passes on
      all three lanes (the SQLite override path is the one that regressed during
      #5571's development).
- [ ] Decide and record whether sibling methods get the same guard, or why not.
- [ ] No new extra API surface in `api:compare`.
