---
title: "time-cast-result-cannot-model-a-zoned-ruby-time"
status: ready
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
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

`Helpers::TimeValue#serialize_cast_value`
(`vendor/rails/activemodel/lib/active_model/type/helpers/time_value.rb:10-21`)
is two steps: `apply_seconds_precision`, then an `is_utc?` arm that answers
`value.getutc` when the value is not already UTC and `value.getlocal`
otherwise.

`packages/activemodel/src/type/helpers/time-value.ts`'s `serializeCastValue`
ports only the first step. The story
`serialize-cast-value-drops-is-utc-normalization` established WHY, and left the
finding at the call site as a `@missingRailsCall` receipt pointing here:

- `Type::DateTime#cast_value` answers a `Temporal.Instant`, an absolute instant
  with no zone representation. It is always UTC and has no local rendering, so
  both arms collapse to the identity.
- `Type::Time#cast_value` can answer a `TimeWithZone`, whose `getutc` /
  `getlocal` DO switch — but both answer a `::Time`
  (`packages/activesupport/src/time-with-zone.ts:523,560`), and trails' quoting
  layer refuses one: `typeCast` raises `can't cast Time`
  (`packages/activerecord/src/connection-adapters/abstract/quoting.ts:133`),
  which accepts only the `Temporal` values and `TimeWithZone`. Porting the arm
  verbatim reds three `attribute-methods.test.ts` time zone-aware tests with
  exactly that TypeError (measured).

So the deviation is not in this method: it is in the choice of cast result for
`Type::DateTime` / `Type::Time`, which cannot model a `::Time` that carries its
zone AND that the adapters can quote.

## Acceptance criteria

- [ ] Decide the representable cast result for `Type::DateTime` / `Type::Time`
      that models a zoned Ruby `::Time` and that
      `AbstractAdapter#typeCast`/`quote` accept.
- [ ] With that in place, port `time_value.rb:12-19` verbatim onto
      `serializeCastValue` and delete the `@missingRailsCall` receipt at
      `packages/activemodel/src/type/helpers/time-value.ts`.
- [ ] A test covering `default_timezone = :local` (the `getlocal` arm).
- [ ] No test renames.
