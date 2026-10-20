---
title: "port-date-helper-select-date-datetime-time-tests"
status: done
updated: 2026-10-20
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9112
claim: "2026-10-20T00:48:55Z"
assignee: "actionview-template-compile-loads-precompiled-module"
blocked-by: null
closed-reason: null
---

## Context

`port-date-helper-select-tests-remainder` ported the `test_select_day` … `test_select_second` families of
`vendor/rails/v8.0.2/actionview/test/template/date_helper_test.rb:206-863` into
`packages/actionview/src/template/date-helper.test.ts`. Still unported:

- `date_helper_test.rb:864-1250` — the `test_select_date*` family (incl. too-big-range, zero/nil values,
  separators, css classes, hidden).
- `:1251-1581` — the `test_select_datetime*` family.
- `:1582-1835` — the `test_select_time*` family, and `test_select_html_safety` / the `travel_to` year cases at `:3582-3660`.
- `vendor/rails/v8.0.2/actionview/test/template/date_helper_i18n_test.rb` (191 lines) — new `date-helper-i18n.test.ts`.

Bodies are `expected = +%(...)` / `expected << ...` builders plus `assert_dom_equal expected, select_x(...)`;
flatten each `expected` into one string literal and camelCase the kwargs.

## Acceptance criteria

- [ ] Every test listed above is ported with its Rails name verbatim.
- [ ] Any `DateTimeSelector` gap they surface is fixed in `packages/actionview/src/helpers/date-helper.ts`.
