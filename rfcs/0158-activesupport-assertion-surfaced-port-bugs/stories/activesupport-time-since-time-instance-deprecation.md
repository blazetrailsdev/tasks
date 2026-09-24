---
title: "Time#since(Time) does not emit the deprecation Rails asserts"
status: done
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8043
claim: "2026-09-24T17:14:05Z"
assignee: "website-sandbox-drops-base-adapter-assignment"
blocked-by: null
closed-reason: null
---

## Context

Parked `since with instance of time deprecated` in `packages/activesupport/src/core-ext/time-ext.test.ts`: Rails `assert_deprecated(ActiveSupport.deprecator) { Time.now.since(Time.now) }` (`time_ext_test.rb:285-289`). `since` in `packages/activesupport/src/core-ext/time/calculations.ts:213` takes `number | Duration` and never warns. The prior test asserted plain arithmetic instead. Not investigated which Rails release removed the deprecation.

## Acceptance criteria

- Passing a Time to `since` warns through `deprecator()`; test un-skipped.
