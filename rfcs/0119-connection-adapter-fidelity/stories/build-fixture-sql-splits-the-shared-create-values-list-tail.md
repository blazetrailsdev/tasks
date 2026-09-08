---
title: "build_fixture_sql duplicates its create_values_list tail into both branches and calls create_values in one"
status: claimed
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: "2026-09-08T19:43:53Z"
assignee: "rails-test-name-parity-rollout-actionview"
blocked-by: null
closed-reason: null
---

## Context

Rails' `build_fixture_sql` builds the values list once and assigns it once
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:630-645`):

```ruby
if values_list.size == 1
  values = values_list.shift
  new_values = []
  columns.each_key.with_index { |column, i|
    unless values[i].equal?(DEFAULT_INSERT_VALUE)
      new_values << values[i]
      manager.columns << table[column]
    end
  }
  values_list << new_values
else
  columns.each_key { |column| manager.columns << table[column] }
end

manager.values = manager.create_values_list(values_list)
```

Both arms fall through to one `create_values_list(values_list)` — the
single-row arm pushes its filtered row back onto `values_list` and does not
assign separately.

`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`
(`buildFixtureSql`) splits that into two different assignments with two
different Arel calls:

```ts
if (valuesList.length === 1) {
  ...
  manager.values = manager.createValues(newValues);
} else {
  ...
  manager.values = manager.createValuesList(valuesList);
}
```

so the single-row path goes through `createValues` where Rails goes through
`create_values_list`, and the shared tail line at `:645` is duplicated into
both branches. `Arel::InsertManager#create_values` and `#create_values_list`
are different nodes (`arel/insert_manager.rb`), so this is a node-shape
divergence, not just a spelling one.

Surfaced by #7588 while converging the cast-type call on `:619-621`; the
branch structure was out of that story's scope.

## Converged shape

Push `newValues` back onto `valuesList` in the single-row arm and assign
`manager.values = manager.createValuesList(valuesList)` once after the
if/else, as `:643-645` does. Delete the `createValues` call site if nothing
else in the repo needs it.

## Acceptance criteria

- [ ] `buildFixtureSql` has exactly one `manager.values = ...` assignment,
      after the if/else, and it calls `createValuesList`.
- [ ] The single-row arm pushes its filtered row back onto `valuesList`
      rather than assigning from a local.
- [ ] Emitted SQL is unchanged for both the single-row and multi-row paths on
      sqlite, PostgreSQL and MySQL/MariaDB.
