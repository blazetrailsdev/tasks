---
title: "Remove time-ext.ts's Date.now-based day predicates in favour of DateAndTime::Calculations"
status: ready
updated: 2026-09-15
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/time-ext.ts` has its own `isToday` / `isTomorrow` / `isYesterday` (around `:422-448`). They compare a JS `Date`'s local fields against `new Date()`, not against `Date.current`. This duplicates the ported predicates in `core-ext/date-and-time/calculations.ts:166-180`, and those already follow Rails:

- `vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb:30-44`
- `today?` is `to_date == ::Date.current`, and `tomorrow?` / `yesterday?` compare against `::Date.current.tomorrow` / `.yesterday`.
- `next_day?` / `prev_day?` are aliases of `tomorrow?` / `yesterday?`.

The duplicates ignore `Time.zone` (`Date.current` reads `Time.zone.today`). `date-time-ext.test.ts` and `date-ext.test.ts` still import them. Their today/tomorrow/yesterday cases also use real `new Date()` values instead of Rails' `Date.stub(:current, ...)`. trails#7790 converged the same pattern in `time-ext.test.ts`.

## Acceptance criteria

- Delete the `time-ext.ts` predicates. Callers use the `DateAndTime::Calculations` ports.
- Converge the matching `date_time_ext_test.rb` / `date_ext_test.rb` cases to Rails' bodies, with `Date.current` pinned, the way `time-ext.test.ts` now does it.
- Keep the assertion-mismatch mark tighten-only.
