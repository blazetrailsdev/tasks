---
title: "build_count_subquery inlines ONE_AS_ONE and drops Arel.sql's retryable: kwarg"
status: draft
updated: 2026-09-08
rfc: "0110-parity-skip-register-correctness"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Un-skipping `build_count_subquery` in #7603 put its body under the call-argument
ratchet for the first time and immediately found one divergence (`as(column_alias)`
passed a bare string), which #7603 converged. Reading the rest of the body against
Rails while the ratchet was green turned up three more deviations the ratchet does
**not** flag, because they are `naming` rows (report-only) or a dropped kwarg.

Rails — `vendor/rails/activerecord/lib/active_record/relation/calculations.rb:662-678`:

```ruby
def build_count_subquery(relation, column_name, distinct)
  if column_name == :all
    column_alias = Arel.star
    relation.select_values = [ Arel.sql(FinderMethods::ONE_AS_ONE) ] unless distinct
  else
    column_alias = Arel.sql("count_column")
    ...
  end

  subquery_alias = Arel.sql("subquery_for_count", retryable: true)
```

trails — `packages/activerecord/src/relation/calculations.ts:730-754`:

1. `Arel.star` (`arel.rb`) is spelled `new Nodes.SqlLiteral("*")`. Same value,
   but `star` is the Rails name and trails' arel exports it.
2. `Arel.sql(FinderMethods::ONE_AS_ONE)` is spelled
   `new Nodes.SqlLiteral("1 AS one")` — the constant is inlined. trails already
   declares `ONE_AS_ONE` at `relation/finder-methods.ts:15`, but does not export
   it, so the string was duplicated rather than referenced.
3. `Arel.sql("subquery_for_count", retryable: true)` is spelled as the bare
   string `"subquery_for_count"` — **the `retryable: true` kwarg is dropped**,
   and no `Arel.sql` call is made at all. This is the one with possible
   behavioural weight: `retryable:` marks the literal safe for the
   retry-on-connection-error path, so dropping it can change whether a count
   query over a limited/offset relation is retried.

## Converged shape

- `columnAlias = Arel.star` for the `:all` arm.
- Export `ONE_AS_ONE` from `finder-methods.ts` and reference it, matching Rails'
  `FinderMethods::ONE_AS_ONE`.
- `const subqueryAlias = Arel.sql("subquery_for_count", { retryable: true })`,
  and check trails' `Arel.sql` actually carries the `retryable` kwarg through to
  the node — if it does not, that is the first half of this story.

## Acceptance criteria

1. All three sites spell the Rails call, with the Rails constant.
2. `retryable: true` reaches the same place Rails' does, or the story records
   with a Rails `file:line` why trails' node has nowhere to carry it.
3. `parity:api:calls` and `parity:api:calls:args` stay green with no new
   baseline row.
4. `calculations.test.ts` stays green.
