---
title: "DateHelper: port DateTimeSelector and the select_* helpers"
status: in-progress
updated: 2026-10-16
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#8994
claim: "2026-10-16T20:14:55Z"
assignee: "time-with-zone-marshal-load-calls-utc-not-getutc"
blocked-by: null
closed-reason: null
---

## Context

`date_helper.rb` is 21/62 on origin/main. Missing: the whole `DateTimeSelector` class (`initialize`, `select_datetime/date/time/second/minute/hour/day/month/year`, the `sec..year` readers, `build_*`, `month_names`, `translated_*`, `date_order`, `prompt_option_tag`, `input_name_from_type` etc.) and the DateHelper `select_*` wrappers that construct it.

## Acceptance criteria

- [ ] `DateTimeSelector` ported in `helpers/date-helper.ts` in Rails order; `DateHelper#select_datetime` … `#select_year` delegate to it.
- [ ] A representative `date_helper_test.rb` select\_\* case per `DateTimeSelector` entry point ported; the remaining select\_\* cases and `date_helper_i18n_test.rb` are tracked by `port-date-helper-select-tests-remainder`.
