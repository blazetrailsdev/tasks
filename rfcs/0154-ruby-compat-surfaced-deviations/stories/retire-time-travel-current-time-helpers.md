---
title: "activesupport: readers call Time.current/Date.current as Rails does; delete time-travel.ts helpers"
status: draft
updated: 2026-11-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
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

trails#10746 deleted the `clock` holder; `currentTime()` / `currentTimeInstant()` in
`packages/activesupport/lib/time-travel.ts` now just read `Time.now`, but they are still a
trails-invented indirection with no Rails counterpart, exported from the barrel
(`lib/index.ts:542-543`). Their readers re-derive the Rails bodies by hand:

- `TimeWithZone#isPast` / `isFuture` (`lib/time-with-zone.ts:698-704`) compare `_epochMs` with
  `currentTime()`. Rails: `def past?; utc.past?; end` / `def future?; utc.future?; end`
  (`vendor/rails/v8.0.5.2/activesupport/lib/active_support/time_with_zone.rb:244-246`, `:269-271`),
  where `Time#past?` is `self < ::Time.current` (`core_ext/date_and_time/calculations.rb`).
- `TimeWithZone#isToday` / `isTomorrow` / `isYesterday` (`lib/time-with-zone.ts:706-725`) build a
  `TimeWithZone` from `currentTime()` and compare y/m/d. Rails: `time.today?` / `time.tomorrow?` /
  `time.yesterday?` (`time_with_zone.rb:250-265`), i.e. `to_date == ::Date.current`
  (`core_ext/date_and_time/calculations.rb:30-43`).
- `time-ext.ts` `current()` (`:54-60`) and `isPast` / `isFuture` (`:424-432`) read the helpers
  where Rails' `Time.current` is `::Time.zone ? ::Time.zone.now : ::Time.now`
  (`core_ext/time/calculations.rb:39-41`, already ported as `core-ext/time/calculations.ts#current`).
- `core-ext/date-time/calculations.ts`, `messages/message-metadata-tests.ts`,
  `testing/time-helpers.ts` (`travelBack`, private `currentTime`) also read them.

## Acceptance criteria

- Each reader above calls what Rails calls (`utc.isPast()`, `time.isToday()`, `Time.current`,
  `Date.current`, `Time.now`) at the Rails site.
- `lib/time-travel.ts` and its two barrel exports are deleted; `grep -rn time-travel.js packages/*/lib` is empty.
- `parity:api:calls` / `:extra` non-negative; time-ext, time-with-zone, time-travel, date-time-ext tests green.
