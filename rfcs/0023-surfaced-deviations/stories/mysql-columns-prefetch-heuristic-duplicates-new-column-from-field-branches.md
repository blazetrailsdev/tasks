---
title: "AbstractMysqlAdapter#columns pre-fetches SHOW CREATE TABLE behind an invented branch-prediction heuristic"
status: done
updated: 2026-08-13
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6483
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `new_column_from_field` resolves a function default by querying inside
the method, in the branch that needs it
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:198-201`,
`:176-186`):

```ruby
elsif default && default_type(table_name, field_name) == :function
  default, default_function = nil, default
end

def default_type(table_name, field_name)
  match = create_table_info(table_name)&.match(/`#{field_name}` (.+) DEFAULT ('|\d+|[A-z]+)/)
  ...
end
```

trails' port cannot: `newColumnFromField`
(`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts:360-403`)
is sync, so it takes a `createTableInfoFn: (tableName) => string | null`
callback, and `AbstractMysqlAdapter#columns`
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:179-200`)
pre-fetches `SHOW CREATE TABLE` behind a `needsCreateInfo` heuristic that
re-implements every earlier branch of `new_column_from_field` (digit default,
quoted string, `DEFAULT_GENERATED`, datetime + `CURRENT_TIMESTAMP`) to decide
whether the round-trip is needed at all.

That heuristic is invented surface with no Rails counterpart, and it is a
duplicate of the branch conditions it predicts — the two drifted apart already
once: PR #6451 had to change the `DEFAULT_GENERATED` guard in _both_ places to
keep them in step, and a future edit to one branch will silently mispredict.

## Converged shape

Make the port async where Rails is sync-with-a-query: `newColumnFromField`
becomes `async` and calls `this.createTableInfo(tableName)` itself from the
`default_type` branch, exactly where Rails does (a call in a branch nothing
else reaches costs the round-trip only when Rails pays it, and MySQL's
`create_table_info` is memoized in Rails via `@table_string_cache` — check
whether trails memoizes too before assuming a per-column fetch).

Then `AbstractMysqlAdapter#columns` deletes `needsCreateInfo` and the
pre-fetch, and `defaultType` takes `(tableName, fieldName)` as Rails does
rather than a pre-fetched `createTableInfo` string.

Check the sync callers of `newColumnFromField` first — `Mysql2Adapter` may
override `columns` for performance, and the mysql2 fast path may construct
columns synchronously.

## Acceptance criteria

- [ ] `newColumnFromField` resolves `default_type` itself; no caller pre-fetches
      `SHOW CREATE TABLE` or predicts which branch will need it.
- [ ] `needsCreateInfo` and the `createTableInfoFn` parameter are gone.
- [ ] `defaultType(tableName, fieldName)` matches Rails' signature.
- [ ] MySQL and MariaDB lanes green; no increase in `SHOW CREATE TABLE`
      round-trips per `columns()` call for tables that do not need one.
