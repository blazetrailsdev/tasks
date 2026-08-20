---
title: "Mix AcceptsMultiparameterTime in via include() instead of a per-call wrapper"
status: claimed
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: "2026-08-20T17:30:03Z"
assignee: "converge-includes-preload-colon-sweep-scoping-and-adapters"
blocked-by: null
closed-reason: null
---

## Context

Rails mixes the multiparameter behaviour in at class-definition time, with the
`defaults:` closed over by `AcceptsMultiparameterTime#initialize`:

- `vendor/rails/activemodel/lib/active_model/type/date.rb:28` — `include Helpers::AcceptsMultiparameterTime.new`
- `vendor/rails/activemodel/lib/active_model/type/date_time.rb:44-46` — `include Helpers::AcceptsMultiparameterTime.new(defaults: { 4 => 0, 5 => 0 })`
- `vendor/rails/activemodel/lib/active_model/type/time.rb:40-42` — `include Helpers::AcceptsMultiparameterTime.new(defaults: { 1 => 2000, 2 => 1, 3 => 1, 4 => 0, 5 => 0 })`

`AcceptsMultiparameterTime` is a `Module` subclass; `include`ing an instance of
it mixes `InstanceMethods` plus the `define_method`-generated
`value_from_multiparameter_assignment` straight onto the type class, so `cast`,
`assert_valid_value` and `value_constructed_by_mass_assignment?` ARE the type's
own methods and `super` is the type's real ancestor.

trails instead makes it a plain class wrapping a type
(`packages/activemodel/src/type/helpers/accepts-multiparameter-time.ts:14-22`),
constructs a fresh instance per call, and re-spells the three `InstanceMethods`
by hand in each type class:

- `packages/activemodel/src/type/date.ts:185-217`
- `packages/activemodel/src/type/date-time.ts:177-217`
- `packages/activemodel/src/type/time.ts:210-246`

Three consequences: the `InstanceMethods` bodies exist four times over rather
than once; `super` is a `this.type` delegation rather than the ancestor chain
(which is how the `else super(value)` arm came to be dropped — see
`converge-accepts-multiparameter-time-assert-valid-value-super-arm`); and the
`defaults` are re-allocated on every cast instead of being closed over once at
class definition.

CLAUDE.md's settled idiom for Ruby `include` is `include()` / `Included<>` from
`@blazetrails/activesupport` (see `activesupport/src/include.ts`, and
`relation.ts` + `relation/query-methods.ts` for a worked example), which is what
lets the mixin's methods live at the Rails name in the Rails file while `this`
resolves to the actual type subclass.

## Acceptance criteria

- `AcceptsMultiparameterTime` is a factory returning a mixin carrying
  `InstanceMethods` plus `valueFromMultiparameterAssignment`, closed over
  `defaults`, applied with `include()` / `Included<>`.
- `DateType`, `DateTimeType` and `TimeType` mix it in at class definition with
  the Rails `defaults` above, and drop their hand-spelled `cast` /
  `assertValidValue` / `isValueConstructedByMassAssignment` copies.
- The type-specific `value_from_multiparameter_assignment` overrides that DO
  exist in Rails stay and call `super`: `date.rb:75-78`'s `new_date` narrowing
  and `date_time.rb:77-83`'s missing-key check.
- `pnpm parity:api:extra --package activemodel` holds `accepts-multiparameter-time.ts`
  at 0 novel; `pnpm parity:api:calls` / `:args` clean.
