---
title: "reverseSqlOrder invents an IrreversibleOrderError for composite primary keys"
status: claimed
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-19T21:31:09Z"
assignee: "reverse-sql-order-composite-pk-invented-raise"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing #4957 (`relations-reverse-order-no-pk`).

`packages/activerecord/src/relation/query-methods.ts` — `reverseSqlOrder`, empty-order
branch. When the relation has no order and the model has a **composite** primary key,
trails raises:

```text
IrreversibleOrderError: Relation has no current order and table has a composite
primary key; cannot determine default reverse order
```

Rails does not do this. `vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:2016`:

```ruby
def reverse_sql_order(order_query)
  if order_query.empty?
    return [table[primary_key].desc] if primary_key
    raise IrreversibleOrderError, "..."
  end
```

`primary_key` returns an Array for a composite PK, which is truthy, so Rails takes the
`table[primary_key].desc` path — it never reaches the raise. The raise is reserved
solely for a **nil** primary key (the no-PK table case, now fixed in #4957).

Both the extra raise and its message text are trails inventions with no Rails
counterpart, so `CpkOrder.all().reverseOrder()` raises here but returns an ordered
relation in Rails.

## Scope

Determine what `table[primary_key].desc` actually emits for an Array primary key in
Arel (Arel is not vendored under `vendor/rails/`, so this needs verifying against a
real Rails console or the arel gem source rather than assumed), then converge trails
to that behavior and drop the invented raise + message.

Note the empty-order branch is only reachable at all as of #4957 — before that,
`reverseOrderBang` short-circuited on an empty `_orderClauses` and never called
`reverseSqlOrder`, which is why this deviation was dormant.

## Acceptance criteria

- `reverseSqlOrder` no longer raises `IrreversibleOrderError` for a composite primary key
- Composite-PK default reverse order matches Rails' `table[primary_key].desc` output
- The no-PK raise (`Edge.all().reverseOrder()`) continues to raise, per
  `relations_test.rb:367`
- A test covers the composite-PK path using a canonical cpk model (`CpkOrder`/`CpkBook`)
