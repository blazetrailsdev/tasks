---
title: "Port Tags::CollectionSelect/GroupedCollectionSelect/TimeZoneSelect/WeekdaySelect"
status: ready
updated: 2026-10-15
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: ["port-form-options-helper-and-select-tag"]
deps-rfc: []
est-loc: 500
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Tags::CollectionSelect`, `Tags::GroupedCollectionSelect`, `Tags::TimeZoneSelect`, `Tags::WeekdaySelect` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/`) and their `FormOptionsHelper` / `FormBuilder` entry points (`collection_select`, `grouped_collection_select`, `time_zone_select`, `weekday_select`) are unported. Each tag shows 26 missing in parity, most from the FormOptionsHelper include.

## Acceptance criteria

- [ ] Four tag files ported one per Rails file, using SelectRenderer; the four helper + FormBuilder methods ported.
- [ ] The matching `form_options_helper_test.rb` / i18n cases ported; parity rows for these four files and `form_options_helper.rb` at 0 missing.
