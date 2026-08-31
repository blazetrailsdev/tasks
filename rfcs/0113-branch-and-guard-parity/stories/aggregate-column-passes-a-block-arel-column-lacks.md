---
title: "aggregate_column passes arel_column a block Rails does not, taking an invented arm"
status: claimed
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 5
pr: null
claim: "2026-08-31T14:08:44Z"
assignee: "inline-ruby-bodies-extracted-as-named-helpers"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while spelling `select_for_count`'s `:all` Symbol (PR #7263).

Rails' `aggregate_column` is a three-arm `case` and its `else` calls
`arel_column` with **no block**
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:414-423`):

```ruby
def aggregate_column(column_name)
  case column_name
  when Arel::Expressions
    column_name
  when :all
    Arel.star
  else
    arel_column(column_name)
  end
end
```

With no block, `arel_column` falls through its own arms to
`Arel.sql(is_symbol ? quote_table_name(field) : field)`
(`query_methods.rb:1990-2007`).

`packages/activerecord/src/relation/calculations.ts`'s `aggregateColumn`
passes a block Rails does not:

```ts
return arelColumn.call(rel as never, columnName, (field: string) =>
  pks.includes(field) ? table.get(field) : new Nodes.SqlLiteral(field),
);
```

So a column name that is not in `columns_hash` and is not a `table.column`
pair takes a trails-invented arm: a primary-key name becomes
`table[field]` where Rails would have produced a bare `Arel.sql(field)`,
and every other name becomes an unquoted `SqlLiteral` where Rails may
quote it. The `block_given?` arm of `arel_column` is reached in trails
where Ruby reaches the `Arel.arel_node?` / `Arel.sql` arms.

## Converged shape

Call `arelColumn` with no block, and let `arelColumn`'s own trailing arms
(`Arel.arel_node?(field)` then `Arel.sql(...)`) run, matching
`calculations.rb:414-423` and `query_methods.rb:1990-2007`.

## Acceptance criteria

- [ ] `aggregateColumn`'s `else` arm calls `arelColumn` with no block.
- [ ] `arelColumn`'s no-block tail arms exist and mirror
      `query_methods.rb:2002-2006`, including the Symbol-quoting branch.
- [ ] `calculations.test.ts` green on all three adapter lanes, in
      particular the `count("*")`, grouped-count and `count(:all)` paths.
