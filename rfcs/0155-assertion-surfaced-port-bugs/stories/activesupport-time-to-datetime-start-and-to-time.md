---
title: "Time#to_datetime has no start; Time#to_time returns a Temporal"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Parked `to datetime` in `packages/activesupport/src/core-ext/time-ext.test.ts` with its final Rails assertion `assert_equal ::Date::ITALY, Time.utc(...).to_datetime.start` (`time_ext_test.rb:885-894`). `Time#toDatetime` (`packages/date/src/time.ts:1308`) returns a `Temporal.PlainDateTime | ZonedDateTime`, which has no `start`. The other listed rows for this area (`to date`, `to time`, `rfc3339 with fractional seconds`) already report 0 mismatches after the earlier PR, so only `to datetime` is parked.

## Acceptance criteria

- `Time#to_datetime` returns a `DateTime` with Ruby's default `start`; test un-skipped.
