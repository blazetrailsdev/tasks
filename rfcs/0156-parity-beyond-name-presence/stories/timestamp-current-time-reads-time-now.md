---
title: "timestamp-current-time-reads-time-now"
status: draft
updated: 2026-11-16
rfc: "0156-parity-beyond-name-presence"
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

Split from `activerecord-converge-pinned-protocol-body-divergences`. `Timestamp::ClassMethods#current_time_from_proper_timezone` (`vendor/rails/v8.0.2/activerecord/lib/active_record/timestamp.rb:79-81`) is `with_connection { |c| c.default_timezone == :utc ? Time.now.utc : Time.now }`. `packages/activerecord/lib/timestamp.ts` `currentTimeFromProperTimezone` builds the time as `RubyTime.at(new Rational(currentTimeInstant().epochNanoseconds, 1_000_000_000n))` and calls `getutc()` / `getlocal()`, because `Time.now` (`packages/date/lib/time.ts:623`) reads the wall clock and ignores `travel_to` (`packages/activesupport/lib/time-travel.ts:59` `currentTimeInstant`). Rails' `travel_to` stubs `Time.now` itself (`activesupport/lib/active_support/testing/time_helpers.rb`).

## Acceptance criteria

- [ ] `Time.now` honours `travel_to` / `freeze_time`.
- [ ] `currentTimeFromProperTimezone` is `c.defaultTimezone === "utc" ? Time.now().utc() : Time.now()`, line for line.
- [ ] timestamp tests pass under travel.
