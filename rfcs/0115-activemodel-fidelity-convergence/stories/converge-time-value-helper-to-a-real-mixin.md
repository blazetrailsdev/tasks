---
title: "Make Helpers::TimeValue a real mixin instead of instance-field assignments and a duplicated serializeCastValue"
status: claimed
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: "2026-08-20T19:50:09Z"
assignee: "attribute-method-generation-driven-from-schema-reflection"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing PR #6785 (`converge-date-time-type-serialize-onto-the-mixin`).

`Helpers::TimeValue` is a real Ruby module that `Type::DateTime` and `Type::Time`
`include` AFTER `Helpers::AcceptsMultiparameterTime`
(`vendor/rails/activemodel/lib/active_model/type/date_time.rb:42-47`,
`vendor/rails/activemodel/lib/active_model/type/time.rb:38-43`). Its members are
`serialize_cast_value`, `apply_seconds_precision`, `user_input_in_time_zone`,
`new_time` and `fast_string_to_time`
(`vendor/rails/activemodel/lib/active_model/type/helpers/time_value.rb:9-95`).

trails does not model it as a module. `packages/activemodel/src/type/helpers/time-value.ts`
exports loose `this`-typed functions, which `date-time.ts` and `time.ts` assign
as INSTANCE FIELDS (`protected applySecondsPrecision = applySecondsPrecision;`
and two siblings, in both files), and `serialize_cast_value` is not in the helper
at all — each class hand-spells its own copy in the class body. Two consequences:

- The members sit on the instance, not in the ancestry, so nothing resolves
  through `super` and a subclass cannot override one for its parent to reach.
- `serializeCastValue` is duplicated per type rather than inherited once.

PR #6778 built the settled shape for exactly this: `AcceptsMultiparameterTime`
is now a real `Module` spliced by `include()` from `@blazetrails/activesupport`
(`packages/activemodel/src/type/helpers/accepts-multiparameter-time.ts`).

## Converged shape

`time-value.ts` exports a `TimeValue` module object holding all five members,
including the single `serializeCastValue`; `date-time.ts` and `time.ts` drop the
instance-field assignments and the duplicated `serializeCastValue`, and
`include(DateTimeType, TimeValue)` AFTER their `include(..., acceptsMultiparameterTime)`
so the ancestry order matches Rails.

Note `ValueType.serializeCastValueCompatible` (`type/value.ts`) answers by
comparing prototype-chain DEPTH of `serialize` vs `serializeCastValue`. Moving
`serializeCastValue` off the class body onto a carrier must keep it at or above
`serialize`'s depth — i.e. the `TimeValue` include must come after the
`AcceptsMultiparameterTime` one, as it does in Rails. The predicate is asserted
for all three types in `date.trails.test.ts` / `date-time.trails.test.ts` /
`time.trails.test.ts`; those must stay green.

`Helpers::TimeValue#serialize_cast_value`'s unported `is_utc?` `getutc`/`getlocal`
arm is a separate, already-filed gap (`serialize-cast-value-drops-is-utc-normalization`)
— do not fold it in here.

## Acceptance criteria

- [ ] `TimeValue` is a module included by `DateTimeType` and `TimeType` after
      `AcceptsMultiparameterTime`, carrying all five Rails members.
- [ ] No instance-field assignment of `applySecondsPrecision` / `fastStringToTime`
      / `newTime`, and no per-type `serializeCastValue` copy.
- [ ] `serializeCastValueCompatible` still true for `DateType` / `DateTimeType` /
      `TimeType`.
- [ ] `pnpm parity:api:calls` / `:args` clean; `pnpm parity:api:extra --package activemodel`
      does not grow.
