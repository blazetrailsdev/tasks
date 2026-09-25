---
title: "instanceof RubyTime dispatch arms route TimeWithZone to Time's own implementation"
status: claimed
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-09-25T03:44:16Z"
assignee: "activesupport-has-no-psych-emitter-for-to-yaml"
blocked-by: null
closed-reason: null
---

## Context

trails#8043 made `twz instanceof RubyTime` true, porting `Time.===`
(`vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb:18-20`)
and `TimeWithZone#is_a?` (`time_with_zone.rb:509-512`) as a `Symbol.hasInstance` hook
in `packages/activesupport/src/core-ext/time/calculations.ts`. Several trails
dispatchers fake Ruby's receiver dispatch with `instanceof RubyTime` and then call
`Time`'s own module function with `.call(x)`. A `TimeWithZone` now matches that arm
and gets `Time`'s implementation where Rails would call the TWZ's own method.
trails#8043 converged the three in `duration.ts` and `changeNsec` in
`activemodel/src/type/helpers/time-value.ts`. The rest were not audited:

- `packages/activesupport/src/time-ext.ts:203` (`timeAdvance.call(date, …)`) and
  `:300` (`timeChange.call`): Rails calls `date.advance` / `date.change`.
- `packages/activesupport/src/core-ext/time/compatibility.ts:11`: `preserveTimezone(time) ? time : time.getlocal()`.
  Rails `Time#to_time` (`core_ext/time/compatibility.rb`) is Time-only; TWZ has its own `to_time`.
- `packages/activesupport/src/core-ext/date-and-time/calculations.ts:36,57,117`
- `packages/activesupport/src/core-ext/date-and-time/zones.ts:58`
- `packages/activesupport/src/core-ext/object/json.ts:187,275`
- `packages/activesupport/src/values/time-zone.ts:348,353`
- `packages/activerecord/src/connection-adapters/abstract/quoting.ts:234`, `mysql/quoting.ts:139`,
  `postgresql/oid/range.ts:148`, `integration.ts:39,83`, `timestamp.ts:207`, `attribute-methods.ts:563`

Converged shape: where Rails makes a receiver-polymorphic call (`t.since`, `t.advance`,
`t.change`, `value.to_s`), call the method on the receiver and delete the `instanceof`
arm. Where Rails really branches on class (`case value when Time`), keep the arm, and
order the TWZ arm first only if Rails' branch order has it first.

## Acceptance criteria

- Every `instanceof RubyTime` / `instanceof Time` site listed above is either converged
  to the receiver call Rails makes or confirmed against its Rails `file:line` as a real
  class branch.
- A `.trails.test.ts` case passes a `TimeWithZone` through each converged site, and fails
  on the pre-change code.
