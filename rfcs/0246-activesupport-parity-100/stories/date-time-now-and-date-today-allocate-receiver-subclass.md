---
title: "date-time-now-and-date-today-allocate-receiver-subclass"
status: closed
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
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
closed-reason: "Duplicate of 0158 time-date-class-methods-allocate-receiver-subclass (same test time_travel_test.rb:465, same Time.#atInstant / Date.today allocation fix), which carries the date-parse-returns-temporal prerequisite edge."
---

## Context

`vendor/rails/v8.0.2/activesupport/test/time_travel_test.rb:465` "time helper travel with time subclass" stays `it.skip` in `packages/activesupport/test/time-travel.test.ts`. `@blazetrails/date`'s `Time.now` (`packages/date/lib/time.ts:622`) allocates through `Time.#atInstant`, so `TimeSubclass.now()` answers a `Time`; `Date.today` (`packages/date/lib/date.ts:4823`) answers a `Temporal.PlainDate`, not an instance of the receiver; `DateTime.now` likewise. Ruby allocates the receiver class (`time_s_now`, `date_s_today`).

## Acceptance criteria

- `Time.now`, `Date.today`, `DateTime.now` allocate `this`, and the travel_to stubs (`time_helpers.rb:197-209`) keep that.
- The test runs with Rails' body and every assertion.
