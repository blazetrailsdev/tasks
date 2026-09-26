---
title: "Type::Helpers::Timezone is free functions, not an included module with is_utc?/default_timezone"
status: done
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8114
claim: "2026-09-25T22:17:02Z"
assignee: "base-inspect-singleton-class-arm"
blocked-by: null
closed-reason: null
---

## Context

Rails `ActiveModel::Type::Helpers::Timezone` (`vendor/rails/activemodel/lib/active_model/type/helpers/timezone.rb:9-19`) is a module with two instance methods, `is_utc?` and `default_timezone`. `Date`, `DateTime` and `Time` include it (`type/date.rb:27`, `date_time.rb`, `time.rb`), and AR's `Type::Internal::Timezone` (`activerecord/lib/active_record/type/internal/timezone.rb:12-18`) overrides both on the receiver.

trails' `packages/activemodel/src/type/helpers/timezone.ts` exports free functions `isUtc()` / `defaultTimezone()`. Each AM type hand-writes a `get isUtc()` that calls the free function, and there is no instance `defaultTimezone`. As a result:

- `AcceptsMultiparameterTime#value_from_multiparameter_assignment` inlines `default_timezone` as `this.isUtc ? Time.utc : Time.local` (`accepts-multiparameter-time.ts`, trails#8072) where Rails does `::Time.public_send(default_timezone, *values)` (`accepts_multiparameter_time.rb:46`).
- `helpers/time-value.ts` still falls back to the free helper with `this?.isUtc ?? isUtc()` (`:111,112,132`), where Rails calls `is_utc?` on the receiver (`time_value.rb:56-58`).
- AR types (`packages/activerecord/src/type/{date,date-time,time}.ts`) override only `isUtc`, and `type/internal/timezone.ts`'s `Timezone` class is not included into them.

## Acceptance criteria

- `Helpers::Timezone` is an includable module with `isUtc` and `defaultTimezone` members, included into `DateType` / `DateTimeType` / `TimeType` in place of the hand-written getters.
- AR's `Type::Internal::Timezone` overrides both members through `include`, as in Rails.
- The multiparameter body reads `Time[this.defaultTimezone](...values)`, and `time-value.ts` calls the receiver's `isUtc` with no free-function fallback.
