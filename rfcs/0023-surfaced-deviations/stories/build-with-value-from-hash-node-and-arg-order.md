---
title: "build-with-value-from-hash-node-and-arg-order"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into build-with-expression-nested-arg-and-invented-cte-name-guard — both are divergences inside the same two ported bodies at relation/query-methods.ts:2359-2394 (build_with_value_from_hash / build_with_expression_from_value, query_methods.rb:1923-1950)"
---

## Context

Surfaced while burning down RFC 0096 wave-2 naming rows.

`QueryMethods#build_with_value_from_hash`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1923-1927`):

```ruby
def build_with_value_from_hash(hash)
  hash.map do |name, value|
    Arel::Nodes::TableAlias.new(build_with_expression_from_value(value), name)
  end
end
```

trails (`packages/activerecord/src/relation/query-methods.ts:2380-2394`)
builds `new Nodes.Cte(name, expr)` — a different Arel node class **and** the
reversed argument order. That makes the RFC 0096 row
(`new`: Ruby `ref:buildWithExpressionFromValue, ref:name` → TS
`ref:name, ref:expr`) an a1 finding, not a rename, so wave 2 leaves it
standing.

The TS body also raises an invented `ArgumentError` on a CTE name that is not
a bare SQL identifier (`query-methods.ts:2386-2390`); Rails has no such check.

## Acceptance criteria

- [ ] `buildWithValueFromHash` constructs the Rails node
      (`Arel::Nodes::TableAlias`) with Rails' argument order
      `(buildWithExpressionFromValue(value), name)`, or the divergence is
      justified at the call site with the Arel-side reason.
- [ ] The invented identifier validation is removed or traced to a Rails
      raise site.
- [ ] `pnpm parity:api:calls:args` stays green and the `query-methods.ts`
      `build_with_value_from_hash` naming row is gone.
- [ ] `with(...)` / CTE tests pass.
