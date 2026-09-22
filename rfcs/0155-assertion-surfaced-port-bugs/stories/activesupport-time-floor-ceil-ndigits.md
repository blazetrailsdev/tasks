---
title: "Time#floor(ndigits) / Time#ceil(ndigits) unported on packages/date Time"
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

Parked tests `floor` and `ceil` in `packages/activesupport/src/core-ext/time-ext.test.ts`. Rails `test_floor` / `test_ceil` (`vendor/rails/activesupport/test/core_ext/time_ext_test.rb:128-149`) call Ruby core `Time#floor(ndigits)` / `Time#ceil(ndigits)` and compare `subsec` as Rationals. `packages/date/src/time.ts` defines neither; the old test exercised an unrelated `floor(date, ms)` helper in `packages/activesupport/src/time-ext.ts:432`. That helper is now unreferenced by tests and is a candidate for removal.

Depends on `activesupport-time-sec-fraction-rational` for the `subsec` Rational comparisons.

## Acceptance criteria

- `Time#floor` / `Time#ceil` with `ndigits` implemented on `packages/date` `Time`; both tests un-skipped and green.
