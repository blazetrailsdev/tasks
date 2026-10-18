---
title: "Seat Date.beginning_of_week on the Date class; drop the DateCalculations re-export"
status: ready
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Date.beginning_of_week` / `Date.beginning_of_week=` are class methods on `Date` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/date/calculations.rb`). `Date::DAYS_INTO_WEEK` is a constant on `DateAndTime::Calculations` (`core_ext/date_and_time/calculations.rb`). trails#9013 exported them from `packages/activesupport/src/index.ts` as an invented `DateCalculations` namespace plus a bare `DAYS_INTO_WEEK`, so that `weekday_options_for_select` (`actionview/lib/action_view/helpers/form_options_helper.rb:611-617`) and `Tags::WeekdaySelect#render` (`tags/weekday_select.rb`) could read `Date.beginning_of_week`.

## Acceptance criteria

- [ ] `beginningOfWeek` / `setBeginningOfWeek` are seated on the ActiveSupport `Date` class, so a caller writes `Date.beginningOfWeek()`.
- [ ] `DAYS_INTO_WEEK` is reachable at its Rails constant path.
- [ ] The `DateCalculations` re-export is removed, and `form-options-helper.ts`, `tags/weekday-select.ts` and the form-options tests use the converged spelling.
