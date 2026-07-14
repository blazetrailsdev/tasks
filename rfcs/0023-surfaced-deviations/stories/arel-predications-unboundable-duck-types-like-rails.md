---
title: "arel-predications-unboundable-duck-types-like-rails"
status: ready
updated: 2026-07-14
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

Surfaced by review of PR #4876 (arel-unboundable-sign-duck-types-like-rails).

**Scope note (re-scoped after #4876 review).** #4876 converged BOTH live
`unboundableSign` implementations onto Rails' duck-typed `unboundable?`:
the visitor's (`packages/arel/src/visitors/to-sql.ts`, mirroring
`arel/visitors/to_sql.rb:905-907`) and `predications-range.ts`'s (mirroring
`arel/predications.rb:252-253`), which had an `infinitySign` fallback that made
`between(Float::INFINITY..3)` emit `1=0` where Rails emits `lteq(3)`.
**Neither of those is in scope here — do not re-file them.**

What remains is the third copy, which is dead surface rather than a live bug.

`packages/arel/src/predications.ts:363-368` stubs the predicate:

```ts
isUnboundable(this: PredicationHost, value: unknown): boolean {
  void this;
  void value;
  return false;
},
```

with the comment "The TS port has no analog of Ruby's `unboundable?` protocol,
so this returns false; kept for surface fidelity."

That comment is **false**. Trails has three producers of the protocol:
`QueryAttribute#isUnboundable`
(`activerecord/src/relation/query-attribute.ts:96`), `BindParam#isUnboundable`
(`arel/src/nodes/bind-param.ts:50`), and `UnboundableBound#isUnboundable`
(`activerecord/src/relation/predicate-builder/range-handler.ts:21`).

It is **latent, not live**: the real `between` / `not_between` path is ported in
`packages/arel/src/predications-range.ts`, which reads the protocol correctly as
of #4876. The stub is reachable only via `Attribute#isOpenEnded`
(`arel/src/attributes/attribute.ts:375-385`) and `Attribute#isUnboundable`
(`:371-373`), neither of which has a live call site. It is a trap: anything that
starts routing `between` through `Predications.isOpenEnded` silently loses
unboundable collapse (#4433).

The real question this story must answer is the duplication. Rails has exactly
ONE `unboundable?` in `predications.rb` serving `between`/`not_between`; trails
has it in two files (`predications.ts` stubbed, `predications-range.ts` real),
plus the visitor's separate-and-legitimate copy (Rails also defines it twice —
`to_sql.rb:905` and `predications.rb:252`).

## Acceptance criteria

- [ ] `Predications.isUnboundable` duck-types the protocol like
      `predications.rb:252-253` instead of `return false`; the stale
      "no analog of Ruby's `unboundable?` protocol" comment is removed.
- [ ] The `predications.ts` / `predications-range.ts` split is resolved: either
      `predications-range.ts`'s `unboundableSign` / `infinitySign` / `isOpenEnded`
      collapse onto the `Predications` versions, or the split is documented as
      the intentional Rails-layout mapping with an anchor. Rails has one copy per
      Ruby file; two copies in the same layer is a deviation either way.
- [ ] `Attribute#isOpenEnded` / `Attribute#isUnboundable`
      (`attributes/attribute.ts:367-385`) either gain a live caller or are
      removed — do not leave dead surface behind.
- [ ] `predications-range.ts`'s `infinitySign` still keeps its `r === true`
      coercion (`:79`); decide whether `infinite?` (`bind_param.rb:35-37`,
      `casted.rb:43-45`) genuinely admits a boolean or whether that is the same
      unanchored invention #4876 removed from the two `unboundableSign` copies.
- [ ] `between` / `not_between` behavior unchanged from #4876's converged state:
      `between(Float::INFINITY..3)` → `lteq(3)`, `between(Float::INFINITY..)` →
      `in([])` (via `infinity?`, predications.rb:42), out-of-range bound collapse
      (#4433) → `in([])`.
- [ ] api:compare / test:compare delta non-negative.
