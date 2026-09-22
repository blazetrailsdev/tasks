---
title: "Time.at(seconds, in:) and Time.=== override are unported"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

Parked in `packages/activesupport/src/core-ext/time-ext.test.ts`:

- `at with in option`: Rails `Time.at(31337, in: -28800)` (`time_ext_test.rb:1191-1193`). `Time.at` in `packages/date/src/time.ts:440` takes `(seconds, microsecondsWithFrac)`, no `in:` kwarg.
- `case equality`: Rails `Time === x` (`time_ext_test.rb:1257-1264`), `activesupport/lib/active_support/core_ext/time/calculations.rb` `===`, which treats a `TimeWithZone` as a `Time` and rejects `DateTime` and subclasses' supertypes. The parked body uses `Symbol.hasInstance` as the JS spelling; no override exists.

## Acceptance criteria

- Both implemented and un-skipped.
