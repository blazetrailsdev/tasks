---
title: "date-current-answers-a-ruby-date"
status: draft
updated: 2026-11-19
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

Rails' `Date.current` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/date/calculations.rb`, `def current`) answers a `::Date`. trails' `current` (`packages/activesupport/lib/core-ext/date/calculations.ts:55`), seated as `RubyDate.current`, answers a `Temporal.PlainDate`. So `DateAndTime::Calculations#tomorrow?` / `#yesterday?` (`packages/activesupport/lib/core-ext/date-and-time/calculations.ts`) have to write `tomorrow.call(new RubyDate(RubyDate.current())).toDate()` where Rails writes `to_date == ::Date.current.tomorrow`. Readers: `actionview/lib/helpers/date-helper.ts:174`, `date/calculations.ts` `yesterday`/`tomorrow`, and the date tests.

## Acceptance criteria

- `RubyDate.current()` answers a `RubyDate`, as `Date.current` does.
- `isTomorrow` / `isYesterday` read `RubyDate.current().tomorrow()` / `.yesterday()` with no wrapping.
- Callers that relied on a `PlainDate` are converged.
