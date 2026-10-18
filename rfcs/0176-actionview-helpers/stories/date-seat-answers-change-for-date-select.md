---
title: "date-seat-answers-change-for-date-select"
status: draft
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

`vendor/rails/v8.0.2/actionview/test/template/active_model_helper_test.rb:83-101`
(`test_date_select_with_errors`, `test_datetime_select_with_errors`, `test_time_select_with_errors`)
render `date_select` / `datetime_select` / `time_select` over a `Date.new(2004, 6, 15)` value.
`DateTimeSelector#set_day_if_discarded` (`actionview/lib/action_view/helpers/date_helper.rb`)
calls `@datetime.change(day: 1)`, which Ruby answers through ActiveSupport's
`Date#change` (`activesupport/lib/active_support/core_ext/date/calculations.rb:143`), and the
`sec min hour day month year` readers (`date_helper.rb:867-876`) `send` to it.

In trails, `packages/actionview/src/helpers/date-helper.ts` `setDayIfDiscarded` does
`rbFSend(this._datetime, "change", { day: 1 })` on a `@blazetrails/date` `Date`, and that raises
`NoMethodError: undefined method 'change' for an instance of Date` (and `'min'` for time_select),
even with `test-helpers/abstract-unit.js` loaded. `activesupport-core-ext-date-calculations-on-date-class`
(done, trails#6286) did not seat `change` where `rbFSend` finds it on this class.

The three tests are parked `it.skip` in `packages/actionview/src/template/active-model-helper.test.ts`
under `// BLOCKED: date-seat-answers-change-for-date-select`.

## Acceptance criteria

- `rbFSend(date, "change", …)` on a `@blazetrails/date` Date resolves AS's `Date#change`; work out the `min` path Rails takes for time_select over a Date, citing it.
- The three tests are un-skipped and pass.
