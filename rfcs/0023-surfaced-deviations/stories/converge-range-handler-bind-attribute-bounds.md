---
title: "converge-range-handler-bind-attribute-bounds"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4887 (arel-predications-unboundable-duck-types-like-rails).

`UnboundableBound` (`activerecord/src/relation/predicate-builder/range-handler.ts:14-26`)
is a trails invention with no Rails counterpart. Rails' RangeHandler
(`activerecord/lib/active_record/relation/predicate_builder/range_handler.rb:12-16`)
is:

```ruby
def call(attribute, value)
  begin_bind = predicate_builder.build_bind_attribute(attribute.name, value.begin)
  end_bind   = predicate_builder.build_bind_attribute(attribute.name, value.end)
  attribute.between(RangeWithBinds.new(begin_bind, end_bind, value.exclude_end?))
end
```

It wraps **both** bounds in a QueryAttribute and lets `QueryAttribute#unboundable?`
(query_attribute.rb:45-51) answer the protocol. Trails instead passes cast values
through and threads only the out-of-range bounds via the `UnboundableBound`
sentinel, which exposes `isUnboundable()` / `isInfinite()` to satisfy arel's
duck-typed predicates.

Converging means deleting `UnboundableBound` and wrapping both bounds in a
QueryAttribute bind, which lights up the real `QueryAttribute` path end to end.

PR #4887 already landed the pieces this depends on, so the protocol is ready:

- `QueryAttribute#isUnboundable` returns the sign and memoizes like
  query_attribute.rb:45-51 (no exception machinery — it reads the
  `isSerializable()` predicate, mirroring integer.rb:74-80).
- `QueryAttribute#isInfinite` returns the sign off `valueBeforeTypeCast`.
- `IntegerType#castValue` casts ±Infinity to null (integer.rb:90), so
  `QueryAttribute(±Infinity).isUnboundable()` is false and the bound is
  open-ended via `infinity?`, exactly as in Rails.
- `Predications#open_ended?` and the `between` decision tree dispatch the
  predicates through self, so a QueryAttribute bind answers them.

## Why this matters

Two known latent divergences are only latent _because_ trails' RangeHandler does
not pass QueryAttributes as bounds. Converging RangeHandler makes them live, so
they must be checked as part of this work:

- `QueryAttribute#typeCast` (`relation/query-attribute.ts:50-52`) casts, where
  Rails' is a no-op (query_attribute.rb:22-24). With Rails' RangeHandler the
  bound is a QueryAttribute, so `value` vs `value_before_type_cast` starts to
  matter for `unboundable?` / `nil?`.
- A non-numeric bound: Rails' `"abc".to_i` is 0 (in range, normal range query);
  trails' `IntegerType#castValue` returns null for a fully non-numeric string.

## Acceptance criteria

- [ ] `UnboundableBound` is deleted; `range-handler.ts` wraps both bounds via the
      predicate-builder's bind-attribute path, mirroring range_handler.rb:12-16.
- [ ] `where(id: <out-of-range>..)` / `..<out-of-range>` still collapse per #4433
      (`in([])` / `not_in([])` / single-sided bound), now via
      `QueryAttribute#unboundable?`.
- [ ] `where(x: Float::INFINITY..3)` still emits `lteq(3)` and
      `where(x: Float::INFINITY..)` still `in([])` (via `infinity?`,
      predications.rb:42).
- [ ] The `typeCast` no-op divergence above is resolved or explicitly shown not to
      affect the bound path, with the Rails anchor.
- [ ] api:compare / test:compare delta non-negative.
