---
title: "activemodel: TimeValue#user_input_in_time_zone inlines every receiver's in_time_zone instead of sending it"
status: draft
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: ["activemodel", "activesupport"]
deps:
  - activemodel-converge-invented-control-flow-arms-type
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `activemodel-converge-invented-control-flow-arms-type`. `packages/activemodel/src/type/helpers/time-value.ts#userInputInTimeZone` reports `+if` seven times in `pnpm parity:api:arms:report --package=activemodel --direction=invented`.

Rails (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/helpers/time_value.rb:42-44`) is one send with no arm:

    def user_input_in_time_zone(value)
      value.in_time_zone
    end

The port inlines every receiver's `in_time_zone` instead: a nil guard Rails does not have (`nil.in_time_zone` is a `NoMethodError`), `TimeWithZone#inTimeZone`, a hand-built `new TimeWithZone(value.toZonedDateTime().toInstant(), zone)` for `Time`, a pass-through for `Temporal.ZonedDateTime`, another hand-built `TimeWithZone` for `Temporal.Instant`, and `String#in_time_zone` for everything else via `String(value)`.

ActiveSupport already ports both Rails methods, as two free functions with the same name: `DateAndTime::Zones#in_time_zone` in `packages/activesupport/src/core-ext/date-and-time/zones.ts` and `String#in_time_zone` in `packages/activesupport/src/core-ext/string/zones.ts`. What is missing is the SEND: one call that reaches the right one for a String, a `Time`, a `TimeWithZone` or a Date, the way `toI` / `toF` / `round` in `@blazetrails/ruby-compat` dispatch a Ruby send over the primitive seats. `rbFSend(value, "inTimeZone")` does not serve, because a JS string has no `inTimeZone` on its prototype and `STRING_METHOD_TABLE` does not carry it.

## Acceptance criteria

- [ ] `userInputInTimeZone` is one `in_time_zone` send with no arm, and the nil guard is gone.
- [ ] The hand-built `new TimeWithZone(...)` arms are deleted; `Time` and `Temporal.Instant` reach `DateAndTime::Zones#in_time_zone`.
- [ ] `pnpm parity:api:arms:report --package=activemodel --direction=invented` shows no row for `type/helpers/time-value.ts#userInputInTimeZone`.
