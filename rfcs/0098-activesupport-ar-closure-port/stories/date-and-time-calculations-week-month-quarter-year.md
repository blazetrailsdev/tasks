---
title: "date-and-time-calculations-week-month-quarter-year"
status: draft
updated: 2026-08-10
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Slot B, second half of `DateAndTime::Calculations` (see sibling story date-and-time-calculations-predicates-and-day-arithmetic for the mixin/wiring context): week/month/quarter/year boundaries — `beginning_of_week`/`end_of_week` (+ `monday`/`sunday`), `weeks_ago`/`weeks_since`, `beginning_of_month`/`end_of_month`, `months_ago`/`months_since`, `beginning_of_quarter`/`end_of_quarter`/`quarter`, `beginning_of_year`/`end_of_year`, `years_ago`/`years_since`, `last_week`/`next_week`/`last_month`/`next_quarter`/…, `all_day`/`all_week`/`all_month`/`all_quarter`/`all_year`, `next_occurring`/`prev_occurring`.

Rails: `vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb`. Depends on Slot A's mixin file existing; if A hasn't merged, claim both as a bundle or branch after it lands (no stacked PRs).

## Acceptance criteria

- Same as Slot A for the remaining mixin members; `beginning_of_week` honors `Date.beginning_of_week` config (`beginning_of_week_default`).
- Range-returning members (`all_*`) return the trails Range analogue Rails' tests exercise.
