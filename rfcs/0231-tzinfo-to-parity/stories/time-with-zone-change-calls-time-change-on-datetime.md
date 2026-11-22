---
title: "TimeWithZone#change calls time.change / utc_offset with no instanceof DateTime arm"
status: draft
updated: 2026-11-22
rfc: "0231-tzinfo-to-parity"
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

Rails' `TimeWithZone#change` (`vendor/rails/v8.0.2/activesupport/lib/active_support/time_with_zone.rb:395-404`) is `new_time = time.change(options)` and, under `:offset`, `new_zone = ::Time.find_zone(new_time.utc_offset)`. Both are plain method calls on whichever `time` holds (Time or DateTime).

trails' `change` (`packages/activesupport/lib/time-with-zone.ts`, after trails#10529) still branches `time instanceof DateTime ? datetimeChange(time, options) : timeChange.call(time, options)` and `newTime instanceof DateTime ? datetimeUtcOffset(newTime) : newTime.utcOffset`. That happens because the DateTime core-ext `change` / `utc_offset` (`core_ext/date_time/calculations.rb`) are free functions, not members of `@blazetrails/date`'s `DateTime`. trails#10529 removed the `periods_for_local` arm and its receipt. These two arms are not receipted.

## Acceptance criteria

- [ ] `change` calls `time.change(options)` and `newTime.utcOffset` with no `instanceof DateTime` arm, as `time_with_zone.rb:395-404` does, through whatever settled shape the DateTime core-ext converges to.
- [ ] `time_with_zone_test.rb`'s change tests over a DateTime-backed TimeWithZone stay green.
