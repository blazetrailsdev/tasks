---
title: "time-past-future-compare-against-time-current"
status: done
updated: 2026-11-21
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10458
claim: "2026-11-20T22:47:06Z"
assignee: "activesupport-api-misses-remainder-after-bundle"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/lib/time-ext.ts:426,431` (`isPast` / `isFuture`) compare against `Temporal.Now.instant()`. Rails compares against `::Time.current` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb`, `past?` / `future?`), so `travel_to` and the system clock apply. Surfaced on trails#10390: native Temporal's `Now` does not follow the JS clock.

## Acceptance criteria

- `isPast` / `isFuture` compare against `Time.current`, as Rails does.
- The trails sub-millisecond tests in `activesupport/test/time-ext.test.ts` freeze the clock through `travelTo`, not a `Temporal.Now` spy.
