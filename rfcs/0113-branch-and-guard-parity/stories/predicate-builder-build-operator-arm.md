---
title: "Port PredicateBuilder#build's operator arm and forward it from #[]"
status: ready
updated: 2026-09-11
rfc: "0113-branch-and-guard-parity"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 60
priority: 60
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#7699, which ported `PredicateBuilder#[]` as
`get(attrName, value)` (`packages/activerecord/src/relation/predicate-builder.ts`).

Rails (`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:53-65`):

```ruby
def [](attr_name, value, operator = nil)
  build(table.arel_table[attr_name], value, operator)
end

def build(attribute, value, operator = nil)
  value = value.id if value.respond_to?(:id)
  if operator ||= table.type(attribute.name).force_equality?(value) && :eq
    bind = build_bind_attribute(attribute.name, value)
    attribute.public_send(operator, bind)
  else
    handler_for(value).call(attribute, value)
  end
end
```

trails' `build(attribute, value)` has no `operator` parameter, so `get` cannot
forward Rails' third argument either. The earlier story
`predicate-builder-force-equality-uniform-build` (RFC 0007, done) lifted the
`force_equality?` dispatch but did not add the `operator` arm: a caller that
passes an explicit operator (Rails' `where.not`-style `[name, value, :not_eq]`
callers, and `PredicateBuilder#[]`) has no path to it.

## Converged shape

- `build(attribute, value, operator = null)` with Rails' single branch:
  `operator ??= forceEquality ? "eq" : null`, then `attribute[operator](bind)`
  or the handler.
- `get(attrName, value, operator = null)` forwards all three arguments.
- Callers that emulate an explicit operator locally switch to passing it.

## Acceptance criteria

- `build` and `get` take and honor `operator`, matching
  `predicate_builder.rb:53-65` in arity and branch order.
- `parity:api` shows no arity mismatch for `PredicateBuilder#[]` / `#build`.
