---
title: "arel-dot-activemodel-attribute-duck-type-vs-is-a"
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

Surfaced by review of PR #4883
(arel-dot-hash-subclass-dispatch-and-classname).

Rails' `Dot#visit` reaches `visit_ActiveModel_Attribute` (`dot.rb:216-218`)
through `Visitor#visit`'s ancestor walk (`visitor.rb:36-41`) — i.e. via
`o.is_a?(ActiveModel::Attribute)`, a class check.

Trails duck-types instead (`packages/arel/src/visitors/dot.ts`,
`isActiveModelAttribute`): `"valueBeforeTypeCast" in o`. Two consequences:

1. `in` reaches through the prototype chain, so a plain record derived via
   `Object.create({ valueBeforeTypeCast: 1 })` takes the attribute arm
   rather than the Hash arm that #4883 established. Pinned by the test
   "an inherited valueBeforeTypeCast takes the attribute arm, not the Hash
   arm" in `dot.test.ts`.
2. Any object literal carrying a `valueBeforeTypeCast` key is treated as an
   attribute — in Rails it is a Hash.

The check cannot simply be scoped to own keys: real
`ActiveModel::Attribute` exposes `valueBeforeTypeCast` as a **prototype
getter** (`packages/activemodel/src/attribute.ts:60`), so
`Object.hasOwn(attr, "valueBeforeTypeCast")` is `false` and own-key scoping
would break every real attribute.

The faithful fix is `instanceof AMAttribute`, and it is available: `arel`
already depends on `@blazetrails/activemodel` (`packages/arel/package.json`)
and already imports `Attribute as AMAttribute` in
`packages/arel/src/nodes/homogeneous-in.ts:3`. `activemodel` does not import
`arel`, so there is no cycle.

Note this flips the trails-invented test "non-Node bind values
(ActiveModel::Attribute shape) don't crash" (`dot.test.ts`), which passes a
plain object literal `{ valueBeforeTypeCast: 42 }` and asserts it takes the
attribute arm. Under Rails semantics that literal is a Hash. That test is a
TS-only extra (not a Rails test name), so converging it is in scope — but it
is a behaviour change to a prior decision and belongs in its own PR.

## Acceptance criteria

- [ ] `isActiveModelAttribute` uses `instanceof AMAttribute`, mirroring
      Rails' `o.is_a?(ActiveModel::Attribute)`.
- [ ] Verify no import cycle is introduced (activemodel must not import arel).
- [ ] Reconcile the two affected tests in `dot.test.ts` (the inherited-key
      pin and the plain-object "don't crash" extra) with the new split;
      do not reword Rails-matched test names.
- [ ] api:compare / test:compare delta non-negative.
