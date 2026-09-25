---
title: "Time does not include DateAndTime::Zones, so Time#in_time_zone is not a method"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/lib/active_support/core_ext/time/zones.rb:7-8` is `class Time; include DateAndTime::Zones`, so `Time.utc(...).in_time_zone("Central Time (US & Canada)")` is a method call. `time_ext_test.rb:1071` and `:1098` (`test_past_with_time_current_as_time_with_zone`, `test_future_with_time_current_as_time_with_zone`) read it that way.

In trails, `DateAndTime::Zones#in_time_zone` (`packages/activesupport/src/core-ext/date-and-time/zones.ts`) is never included onto `RubyTime`. `RubyTime.utc(...).inTimeZone(...)` is a `TypeError`, so trails#8083's ports in `packages/activesupport/src/time-ext.test.ts` had to call the function form `inTimeZone(RubyTime.utc(...), zone)`.

## Converged shape

`include(RubyTime, DateAndTimeZones)` with an `Included<>` declaration merge. It is spelled in `core-ext/time/zones.ts` if that file can take it without a load-time cycle, or else wherever `include DateAndTime::Calculations` currently lives.

## Acceptance criteria

- `RubyTime.utc(2005, 2, 10, 15, 30, 45).inTimeZone("Central Time (US & Canada)")` returns a `TimeWithZone`.
- `time-ext.test.ts`'s "past/future with time current as time with zone" tests use the method form, as Rails does.
- A plain-node import of the built `dist/` modules still succeeds.
