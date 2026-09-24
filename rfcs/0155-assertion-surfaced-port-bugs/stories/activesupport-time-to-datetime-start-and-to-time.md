---
title: "Time#to_datetime has no start; Time#to_time returns a Temporal"
status: blocked
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-09-24T17:14:05Z"
assignee: "website-sandbox-drops-base-adapter-assignment"
blocked-by: "Time#toDatetime (packages/date/src/time.ts:1308) builds the owned DateTime then returns its .toDatetime() Temporal, the same shape as every date constructor (DateTime.civil, date.ts:6044), so the test's DateTime.civil(...) == Time#to_datetime comparison is Temporal-vs-Temporal. Returning a DateTime with Ruby's start (time.c time_to_datetime -> Date::ITALY) needs date-parse-returns-temporal-not-the-owned-date-class (0023, 300 LOC) first: converging only Time#toDatetime breaks the civil comparison."
closed-reason: null
---

## Context

Parked `to datetime` in `packages/activesupport/src/core-ext/time-ext.test.ts` with its final Rails assertion `assert_equal ::Date::ITALY, Time.utc(...).to_datetime.start` (`time_ext_test.rb:885-894`). `Time#toDatetime` (`packages/date/src/time.ts:1308`) returns a `Temporal.PlainDateTime | ZonedDateTime`, which has no `start`. The other listed rows for this area (`to date`, `to time`, `rfc3339 with fractional seconds`) already report 0 mismatches after the earlier PR, so only `to datetime` is parked.

## Acceptance criteria

- `Time#to_datetime` returns a `DateTime` with Ruby's default `start`; test un-skipped.
