---
title: "Date#noon, #since, #ago and duration +/- take a PlainDate instead of a Ruby Date receiver"
status: draft
updated: 2026-11-19
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails defines `Date#middle_of_day` / `noon`, `Date#+` / `Date#-` with duration (`plus_with_duration`, `minus_with_duration`), `ago` and `since` as instance methods on `::Date` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/date/calculations.rb`). trails' ports in `packages/activesupport/lib/core-ext/date/calculations.ts` (`middleOfDay`/`noon` :~80, `plusWithDuration` :~103, `minusWithDuration` :~118, `ago`, `since`) take a `Temporal.PlainDate`. trails#10383 made `Date.current` / `yesterday` / `tomorrow` answer a `RubyDate`, so callers now write `noon(tomorrow().toDate())` (`packages/activejob/test/test-helper.test.ts`, `async-adapter.test.ts`) and `minusWithDuration(current().toDate(), …)` (`packages/activesupport/test/core-ext/duration.test.ts:166`) where Rails writes `Date.tomorrow.noon`.

## Acceptance criteria

- These methods are seated on `RubyDate.prototype` at their Rails names, the way trails#10383 seated `advance` / `beginningOfDay` / `endOfDay` / `midnight`.
- The `.toDate()` adaptations in the activejob and activesupport tests above are removed, and those tests call `RubyDate.tomorrow().noon()` as Rails does.
