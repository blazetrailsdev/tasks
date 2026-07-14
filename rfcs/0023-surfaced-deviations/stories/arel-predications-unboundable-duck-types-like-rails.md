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

Surfaced by review of PR #4876 (arel-unboundable-sign-duck-types-like-rails),
which converged the _visitor's_ `unboundableSign`
(`packages/arel/src/visitors/to-sql.ts`) onto Rails' duck-typed
`unboundable?` (`arel/visitors/to_sql.rb:905-907`). The sibling predicate in
`Predications` was left stubbed and is now demonstrably wrong.

Rails has the _same_ duck-typed predicate a second time, in
`Arel::Predications` (`vendor/rails/activerecord/lib/arel/predications.rb:252-253`):

```ruby
def unboundable?(value)
  value.respond_to?(:unboundable?) && value.unboundable?
end

def open_ended?(value)
  value.nil? || infinity?(value) || unboundable?(value)
end
```

It drives `between` / `not_between` (`predications.rb:38`, `:85`):
`if unboundable?(other.begin) == 1 || unboundable?(other.end) == -1`.

Trails stubs it (`packages/arel/src/predications.ts:363-368`):

```ts
isUnboundable(this: PredicationHost, value: unknown): boolean {
  void this;
  void value;
  return false;
},
```

with the comment "The TS port has no analog of Ruby's `unboundable?`
protocol, so this returns false; kept for surface fidelity."

That comment is **false**: trails has three producers of the protocol —
`QueryAttribute#isUnboundable` (`activerecord/src/relation/query-attribute.ts:96`),
`BindParam#isUnboundable` (`arel/src/nodes/bind-param.ts:50`), and
`UnboundableBound#isUnboundable`
(`activerecord/src/relation/predicate-builder/range-handler.ts:21`).

The stub is currently _latent_, not live: the real `between` path is ported
separately in `packages/arel/src/predications-range.ts`, whose own
`unboundableSign` (`predications-range.ts:87-99`) and `isOpenEnded`
(`:116`) read `isUnboundable()` correctly. The stub is reachable only via
`Attribute#isOpenEnded` (`arel/src/attributes/attribute.ts:375-385`), which
has no live call sites. So this is a fidelity/dead-surface defect, not a
behavior bug today — but it is a trap: anything that starts routing
`between` through `Predications.isOpenEnded` silently loses unboundable
collapse.

Scoped out of #4876 deliberately: that PR converges the visitor
(`to-sql.ts`); this is a different file with its own duplication question
(`predications.ts` vs `predications-range.ts`).

## Acceptance criteria

- [ ] `Predications.isUnboundable` duck-types the protocol like
      `predications.rb:252-253` instead of `return false`; the stale
      "no analog of Ruby's `unboundable?` protocol" comment is removed.
- [ ] Decide and record whether `predications-range.ts`'s `unboundableSign` /
      `isOpenEnded` collapse onto the `Predications` versions, or whether the
      split is the intentional Rails-layout mapping — Rails has ONE
      `unboundable?` in `predications.rb`, so two copies is a deviation either
      way.
- [ ] `Attribute#isOpenEnded` / `Attribute#isUnboundable` either gain a live
      caller or are removed — do not leave dead surface behind.
- [ ] `between` / `not_between` behavior unchanged: out-of-range bound collapse
      (#4433) still passes.
- [ ] api:compare / test:compare delta non-negative.
