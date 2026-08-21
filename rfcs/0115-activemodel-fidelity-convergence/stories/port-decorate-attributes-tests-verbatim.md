---
title: "Port attribute_registration_test.rb's six decorate_attributes tests verbatim"
status: done
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6839
claim: "2026-08-21T20:50:32Z"
assignee: "converge-through-reflection-association-primary-key-body"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/test/cases/attribute_registration_test.rb:162-244`
has six `.decorate_attributes` tests, all built on the file's `MyDecorator`
(`:11-19`) and asserting the DECORATOR — `assert_instance_of MyDecorator`,
`assert_equal "foo", type.name`, `assert_same TYPE_1, type.cast_type` — over
`default_attributes_for`.

`packages/activemodel/src/attribute-registration.test.ts` has three of them,
and they assert cast BEHAVIOUR (`p.readAttribute("name") === "ALICE"`) rather
than the decorator's identity. Until #6834 they were written on top of
`Model.normalizes`, which is now an ActiveRecord method; that PR replaced the
vehicle with a local `myDecorator` helper but deliberately left the assertions
and the missing cases alone, to keep the move-story diff scoped.

Missing entirely (Rails names, verbatim):

- `.decorate_attributes decorates all attributes when none are specified` (:181)
- `.decorate_attributes supports conditional decoration` (:192)
- `superclass attribute types can be decorated` (:219)

Present but paraphrased: `.decorate_attributes decorates specified attributes`
(:162), `.decorate_attributes stacks decorators` (:203),
`re-registering an attribute overrides previous decorators` (:230).

## Acceptance criteria

- All six tests exist under their Rails names, in Rails' order, asserting what
  Rails asserts: decorator instance, `type.name`, and `cast_type` identity
  against the seed types — not just the cast result.
- `myDecorator` becomes a `MyDecorator` class mirroring
  attribute_registration_test.rb:11-19 (`name`, `cast_type`, delegating `cast`),
  so `assert_instance_of` has something to assert.
- The trails analogue of `default_attributes_for` / `class_with` (:246-260) is
  used rather than a fresh ad-hoc subclass per test, matching how Rails builds
  the subject.
- `pnpm parity:test --package activemodel` credit for
  `attribute_registration_test.rb` goes up; assertion-count and assertion-kind
  mismatch counters for the file go down (they are ratcheted —
  `scripts/test-compare/assertion-mismatch-mark.json`).
