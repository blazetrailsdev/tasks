---
title: "Gate missing-gate tests in date_time_precision_test.rb (18)"
status: in-progress
updated: 2026-06-20
rfc: "0032-ar-gate-fidelity-burndown"
cluster: missing-gate
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3714
claim: "2026-06-20T13:37:30Z"
assignee: "gate-missing-date-time-precision"
blocked-by: null
---

## Context

RFC `0032-ar-gate-fidelity-burndown`, cluster `missing-gate`. Follow-up from
`gate-missing-gate-burndown` (PR #3708). 18 `missing-gate` mismatches remain in
`packages/activerecord/src/date-time-precision.test.ts`. Rails gates in
`vendor/rails/activerecord/test/cases/date_time_precision_test.rb` via
`if supports_datetime_with_precision?` (whole class) plus several
`current_adapter?(:PostgreSQLAdapter)` timestamptz variants (formatting/writing
… using timestamptz, datetime precision with zero dumped).

`datetime_with_precision: ALL` already in supports.ts; pg-only variants need an
additional `it.skipIf(adapterType !== "postgres")` composed with the feature
gate.

Refresh exact gates via `pnpm test:compare --package activerecord --gates --json`.

## Acceptance criteria

- [ ] Apply exact Rails gates to all 18 tests
      (`itIfSupports("datetime_with_precision", …)`, composing
      `.skipIf(adapterType !== "postgres")` for timestamptz variants).
- [ ] `test:compare --gates` reports 0 `missing-gate` for
      `date-time-precision.test.ts`.
- [ ] Test names unchanged. No stubs. 500-LOC ceiling.
