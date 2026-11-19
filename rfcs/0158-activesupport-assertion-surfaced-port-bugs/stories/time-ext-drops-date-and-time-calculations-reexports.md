---
title: "time-ext.ts re-exports DateAndTime::Calculations as JS-Date boundary helpers they no longer are"
status: draft
updated: 2026-11-19
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/lib/time-ext.ts:20-48` re-exports `nextWeek`, `prevWeek`, `lastWeek`, `nextOccurring`, `prevOccurring`, `beginningOfWeek`, `endOfWeek` and `allDay` through `allYear` from `core-ext/date-and-time/calculations.ts`, under the file's `@boundary-file` claim that its helpers accept a JS `Date`. Since trails#10383 those functions answer only `RubyDate` / `RubyTime` receivers, which is Rails' `DateAndTime::Calculations` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb`). The re-exports are extra surface on a module Rails doesn't have, and the boundary comment no longer describes them. `packages/activesupport/test/time-ext.test.ts` imports them and adapts each receiver with a local `rb()` helper.

## Acceptance criteria

- `time-ext.ts` no longer re-exports the `DateAndTime::Calculations` functions.
- `test/time-ext.test.ts` imports them from `core-ext/date-and-time/calculations.js` and drops `rb()`, or the cases move to `core-ext/time-ext.test.ts` / `date-ext.test.ts` with `RubyTime` / `RubyDate` receivers.
