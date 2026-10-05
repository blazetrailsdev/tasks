---
title: "Time#minus / #plus types do not admit a Duration after the core-ext reassigns them"
status: draft
updated: 2026-10-05
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
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

`Time#-` is `minus_with_coercion`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/time/calculations.rb:311-316`),
aliased over `minus_with_duration` (`:301-307`), which accepts an
`ActiveSupport::Duration`: `ts - 1.day` is ordinary Rails.

`packages/activesupport/src/core-ext/time/calculations.ts` assigns
`minus: minusWithCoercion` onto `RubyTime.prototype`, so `ts.minus(Duration.days(1))`
works at run time. Its `declare module` block (`:396-408`) declares
`minusWithDuration(other: unknown)` and `minusWithCoercion(other: unknown)`
but does not widen `minus`, so the type stays the date package's
`minus(offset: number | bigint | Rational | Time)` and the call is TS2345.

trails PR 8554 hit this porting `ts - 1.day`
(`vendor/rails/v8.0.2/actionpack/test/controller/render_test.rb:150`) and spelled
it `ts.minusWithCoercion(Duration.days(1)) as Time` in
`packages/actionpack/src/action-controller/controller/render.test.ts`. `plus`
has the same shape (`plus: plusWithDuration`) and should be checked with it.

## Acceptance criteria

- With activesupport's time core-ext loaded, `time.minus(duration)` and
  `time.plus(duration)` type-check, with the return type Rails gives.
- `conditionalHelloWithCollectionOfRecords` in `controller/render.test.ts`
  reads `ts.minus(Duration.days(1))`.
