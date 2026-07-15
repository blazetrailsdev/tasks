---
title: "QueryAttribute#type_cast is a no-op in Rails; trails casts"
status: draft
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced by review of PR #4887 (arel-predications-unboundable-duck-types-like-rails).

Rails' `QueryAttribute#type_cast` is deliberately a **no-op**
(`activerecord/lib/active_record/relation/query_attribute.rb:22-24`):

```ruby
def type_cast(value)
  value
end
```

so `QueryAttribute#value` is the raw `value_before_type_cast`. Trails'
(`packages/activerecord/src/relation/query-attribute.ts:50-52`) casts instead:

```ts
typeCast(value: unknown): unknown {
  return this.type.cast(value);
}
```

This means `value` and `valueBeforeTypeCast` are the same object in trails where
Rails distinguishes them, and any Rails code reading `attribute.value` on a
QueryAttribute gets a cast value where Rails gets the raw one.

## Why it matters

It is currently masked by a second divergence that happens to cancel it, which is
a fragile state to leave the port in:

- `Attribute#isSerializable` (`activemodel/src/attribute.ts:96-97`) passes
  `this.value` to `type.isSerializable`. Rails passes the raw value and
  `Integer#serializable?` (integer.rb:74-80) does its own `cast_value = cast(value)`.
  Because trails pre-casts, the two layers agree today only by accident.
- `QueryAttribute#isUnboundable` (#4887) reads `this.value` for Ruby's
  `value <=> 0`, relying on it already being cast.

Fixing `typeCast` alone will therefore change behavior at both sites and must be
done with them, not before them.

## Acceptance criteria

- [ ] `QueryAttribute#typeCast` is a no-op, mirroring query_attribute.rb:22-24.
- [ ] `value` vs `valueBeforeTypeCast` semantics match Rails for a QueryAttribute.
- [ ] `isUnboundable`'s `value <=> 0` still reads the _cast_ value Rails'
      `serializable?` yields (integer.rb:75), not the now-raw `value`.
- [ ] `Attribute#isSerializable` still answers correctly once the value it passes
      is raw (see the companion story on `IntegerType#castValue`).
- [ ] api:compare / test:compare delta non-negative.
