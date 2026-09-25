---
title: "date-and-datetime-to-time-return-zoned-date-time-not-time"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Surfaced in trails#8114 (story `time-to-time-returns-zoned-date-time-not-time`), which converged `Time#toTime` to return the `Time` itself.

Ruby's `Date#to_time` and `DateTime#to_time` both return a `Time`:

- MRI: `date_to_time` (`vendor/ruby/v3.3.11/ext/date/date_core.c:8973`) and `datetime_to_time` (`date_core.c:9051`).
- ActiveSupport reopens both: `Date#to_time(form = :local)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/date/conversions.rb:83`) and `DateTime#to_time` (`core_ext/date_time/compatibility.rb:15`).

`vendor/ruby/v3.3.11/test/date/test_date_conv.rb:16-20` (`test_to_class`) asserts `assert_instance_of(Time, o.to_time)` for `Time.now`, `Date.today` and `DateTime.now`.

In trails, `@blazetrails/date` `Date#toTime()` (`packages/date/src/date.ts:5485`) and `DateTime#toTime()` (`date.ts:6545`) still return a `Temporal.ZonedDateTime`. The free `toTime` in `packages/activesupport/src/core-ext/time/compatibility.ts` also still carries a Temporal-DateTime arm that returns a `ZonedDateTime`, where Rails' `DateTime#to_time` returns a `Time`. `packages/date/src/test-date-conv.test.ts` "to class" asserts a `Temporal.ZonedDateTime` for the Date/DateTime rows.

## Converged shape

Follow the `Time#toTime` pattern from trails#8114:

- `Date#toTime` / `DateTime#toTime` return a `Time`.
- The Temporal conversion moves to a `toZonedDateTime`-style name.
- ActiveSupport's reopenings (`Date#to_time(form)`, and `DateTime#to_time` with `preserve_timezone ? getlocal(utc_offset) : getlocal`) are installed on the prototypes, as `core-ext/time/compatibility.ts` does for `Time`.
- The free `toTime` goes away.

## Acceptance criteria

- `Date#toTime` and `DateTime#toTime` return `Time`, matching `date_core.c:8973,9051` and the ActiveSupport overrides above.
- `test-date-conv.test.ts` "to class" asserts `Time` for all three rows, as `test_date_conv.rb:16-20` does.
- Callers that wanted the Temporal value use the renamed conversion.
- `pnpm typecheck`, `parity:api:calls` and `parity:api:calls:args` are green.
