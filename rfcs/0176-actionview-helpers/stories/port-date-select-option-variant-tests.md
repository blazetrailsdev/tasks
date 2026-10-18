---
title: "port-date-select-option-variant-tests"
status: ready
updated: 2026-10-18
rfc: "0176-actionview-helpers"
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

`port-date-select-tags-and-time-tag` ported `Tags::DateSelect` / `TimeSelect` /
`DatetimeSelect` (`packages/actionview/src/helpers/tags/date-select.ts`), the
`dateSelect` / `timeSelect` / `datetimeSelect` / `timeTag` helpers and their
FormBuilder methods (`packages/actionview/src/helpers/date-helper.ts`), with
`test_date_select`, `test_time_select`, `test_datetime_select` and the five
`test_time_tag_*` tests. The 800-LOC ceiling left the other option-variant
cases of `vendor/rails/v8.0.2/actionview/test/template/date_helper_test.rb`
unported (`test_date_select_with_selected` at :1855 through the
`datetime_select` family ending near :3670, about 75 tests).

## Acceptance criteria

- Every remaining `date_select` / `time_select` / `datetime_select` test in
  `date_helper_test.rb` is ported to `packages/actionview/src/template/date-helper.test.ts`
  with its Rails name verbatim.
- A failing case drives a fix in `tags/date-select.ts` or `DateTimeSelector`
  rather than a skip.
- `pnpm parity:test --package actionview` shows 0 missing for those tests.
