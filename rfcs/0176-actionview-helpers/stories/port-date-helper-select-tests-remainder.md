---
title: "port-date-helper-select-tests-remainder"
status: ready
updated: 2026-10-19
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

trails#<this PR> ported `ActionView::Helpers::DateTimeSelector` and the `DateHelper#select_*` wrappers
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/date_helper.rb:415-688`, `:710-1226`) into
`packages/actionview/src/helpers/date-helper.ts`, but to stay under the LOC ceiling it ported only 15 of the
136 `test_select_*` cases in `vendor/rails/v8.0.2/actionview/test/template/date_helper_test.rb:206-1835,3582-3660`
into `packages/actionview/src/template/date-helper.test.ts`. `date_helper_i18n_test.rb` (191 lines) is still unported.

Most cases are pure string-literal `expected` builders plus `assert_dom_equal expected, select_x(...)`; they
convert mechanically (kwargs → a camelCase options object, `nil` → `null`, `:sym` → `"sym"`).

## Acceptance criteria

- [ ] The remaining `test_select_*` cases in `date_helper_test.rb` are ported with Rails' names, including the
      `select_date` / `select_datetime` / `select_time` families, the `travel_to` year cases, and `test_select_html_safety`.
- [ ] `date_helper_i18n_test.rb`'s select / prompt / date-order cases are ported (new `date-helper-i18n.test.ts`).
- [ ] Any behaviour gap they surface in `DateTimeSelector` is fixed in place.
