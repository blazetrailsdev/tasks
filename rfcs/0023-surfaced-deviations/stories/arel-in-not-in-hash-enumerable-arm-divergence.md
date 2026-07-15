---
title: "Decide and converge in/notIn for a plain object: Ruby Hash expands, Object.new casts whole"
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

Surfaced by PR #4886, which added the scalar `else` arm to `Attribute#in` /
`#notIn` and widened the Enumerable arm to match any JS iterable.

Ruby's `Hash` IS `Enumerable`, so Rails' `attribute.in({a: 1})`
(predications.rb:65-74) takes the `quoted_array` arm and expands the hash into
its pairs: `[Casted([:a, 1], self)]`. In trails, a plain JS object literal is
not iterable, so it falls to the `else` arm and becomes
`Casted({a: 1}, attribute)` — the container cast whole.

The current behaviour is a deliberate reading, documented at the `isEnumerable`
guard in `packages/arel/src/attributes/attribute.ts`:

- Ruby's `Hash` maps most closely to a JS `Map`, which IS iterable and so
  already expands correctly through the Enumerable arm.
- A JS object literal is the closer analogue of Ruby's `Object.new`, which is
  NOT Enumerable and correctly takes the `else` arm
  (attribute_test.rb:747-757).

So the scalar arm is the better of two readings, but it is not exact: there is
no single JS value that is both "the Hash analogue" and "the Object.new
analogue", and today an object literal silently picks one.

This story is to decide and converge, not to ratify. Options to weigh:

1. Accept and document (status quo) — but then the deviation should be an
   explicit, tested decision rather than an implementation accident.
2. Expand plain objects via `Object.entries` in the Enumerable arm, matching
   Ruby Hash. Risks colliding with the SelectManager duck-type and with any
   caller passing an options-ish object.
3. Reject a plain object at the boundary so the wrong AST cannot be built
   silently.

Note `packages/arel/src/predications.ts:145-176` has the same `else` arm and
will inherit whichever decision lands; see
[[arel-predications-in-not-in-enumerable-arm-iterable]].

## Acceptance criteria

- [ ] A decision is recorded on whether `in({a: 1})` should expand (Ruby Hash)
      or cast whole (Object.new), with the Rails source reasoning.
- [ ] Behaviour matches the decision in BOTH `attributes/attribute.ts` and
      `predications.ts`.
- [ ] Coverage pins the chosen behaviour so it cannot regress silently.
- [ ] The `isEnumerable` doc comment reflects the outcome.
- [ ] api:compare / test:compare delta non-negative.
