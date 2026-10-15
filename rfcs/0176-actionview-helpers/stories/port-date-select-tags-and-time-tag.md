---
title: "DateHelper: date_select/time_select/datetime_select tags and time_tag"
status: ready
updated: 2026-10-15
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: ["port-date-helper-date-time-selector", "port-form-options-helper-and-select-tag"]
deps-rfc: []
est-loc: 400
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After DateTimeSelector, `date_helper.rb` still lacks `date_select`, `time_select`, `datetime_select` and `time_tag`, and `Tags::DateSelect` / `TimeSelect` / `DatetimeSelect` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/date_select.rb` etc.; DateSelect includes SelectRenderer) are unported.

## Acceptance criteria

- [ ] `tags/date-select.ts`, `time-select.ts`, `datetime-select.ts` ported; DateHelper + FormBuilder gain `dateSelect`/`timeSelect`/`datetimeSelect`; `timeTag` ported.
- [ ] Matching `date_helper_test.rb` cases ported; parity `date_helper.rb` and `tags/date_select.rb` at 0 missing.
