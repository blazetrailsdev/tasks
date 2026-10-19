---
title: "form-options-select-tags-tests-remainder"
status: done
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9055
claim: "2026-10-19T12:07:14Z"
assignee: "cache-helper-write-fragment-for-awaits-async-block"
blocked-by: null
closed-reason: null
---

## Context

trails#9013 ported `Tags::CollectionSelect` / `GroupedCollectionSelect` / `TimeZoneSelect` / `WeekdaySelect` and 32 of their `form_options_helper_test.rb` cases into `packages/actionview/src/template/form-options-helper.test.ts`. It skipped the remaining cases to keep the PR in size:
`vendor/rails/v8.0.2/actionview/test/template/form_options_helper_test.rb` — `test_collection_select_under_fields_for*` (:1044-1086), `_with_blank_as_string_and_style` (:1097), `_with_multiple_option_appends_array_brackets_and_hidden_input` (:1107), `test_time_zone_select_under_fields_for*` (:1171-1228), `_with_blank_as_string`, `_with_style`, `_with_blank_and_style`, `_with_blank_as_string_and_style` (:1243-1306), `_with_priority_zones_is_not_implemented_with_grep` (:1342), `_with_priority_zones_and_errors` (:1363), `test_grouped_collection_select_under_fields_for` (:1519), `test_weekday_select_under_fields_for*` (:1598-1624).

## Acceptance criteria

- [ ] Each listed case is ported with Rails' name. The time-zone cases reuse the FakeZones spies already in the file.
- [ ] Any behaviour gap they surface in the four tags or the FormBuilder methods is fixed in place.
