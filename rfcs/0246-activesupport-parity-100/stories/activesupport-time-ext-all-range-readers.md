---
title: "activesupport: port time_ext_test.rb all_day/week/month/quarter/year"
status: done
updated: 2026-11-19
rfc: "0246-activesupport-parity-100"
cluster: test-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10353
claim: "2026-11-19T10:16:36Z"
assignee: "activesupport-api-parallelization-permanence"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/rails/activesupport/test/core_ext/time_ext_test.rb:1266+` has 5 Miss: `all_day`, `all_week`,
`all_month`, `all_quarter` and `all_year`. The file also has 3 skips.

## Acceptance criteria

- [ ] Port the 5 tests into `core-ext/time-ext.test.ts`. The range readers
      live in `core_ext/date_and_time/calculations.rb`.
- [ ] Port each of the 3 skips or give it a receipt.
- [ ] `time_ext_test.rb` reaches 0 Miss.
