---
title: "unboundable? maps a non-comparable value to +1 where Ruby spaceship-zero is nil"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4887 (arel-predications-unboundable-duck-types-like-rails).

`QueryAttribute#unboundable?` (`query_attribute.rb:45-51`) sets
`@_unboundable = value <=> 0`. Ruby's `<=>` returns **nil** for operands that are
not comparable — `"x" <=> 0` is nil — so a cast value that is not numeric leaves
`@_unboundable` nil, i.e. **not unboundable**.

Trails' `compareToZero`
(`packages/activerecord/src/relation/query-attribute.ts`, added by #4887) instead
returns `1` for a non-numeric cast value, treating it as past the upper bound:

```ts
function compareToZero(value: unknown): 1 | -1 {
  if (typeof value === "bigint") return value >= 0n ? 1 : -1;
  if (typeof value === "number") return value >= 0 ? 1 : -1;
  return 1;
}
```

The deviation is currently recorded only as a code comment ("treated as past the
upper bound"), which is what this story replaces.

## Reachability

Unreachable through `IntegerType`, whose `cast` yields `number | null` and whose
`null` is in range (`in_range?(nil)` is `!value` => true, integer.rb:86), so the
sign branch is never taken for a non-numeric. It can only arise for a custom type
that fails `serializable?` while casting to a non-numeric value. Two open stories
change the inputs here and should be checked against it:
`query-attribute-type-cast-is-a-no-op` and `integertype-castvalue-to-i-semantics`.

## Acceptance criteria

- [ ] A non-comparable cast value yields "not unboundable" (Ruby's `nil` from
      `<=> 0`), not `1` — i.e. the producer's `1 | -1 | false` domain, where
      `false` maps to Rails' nil.
- [ ] The `1 | -1 | false` producer convention and the `1 | -1 | 0` helper
      convention documented in `arel/src/predications-range.ts` still hold; the
      `<=> 0`-returns-0 case stays unreachable (0 is in range for every integer
      type, so `serializable?` cannot raise for it — see #4887's discussion).
- [ ] The "treated as past the upper bound" comment is removed once the code no
      longer does that.
- [ ] `between` / `not_between` collapse behavior (#4433) unchanged for numeric
      out-of-range bounds.
