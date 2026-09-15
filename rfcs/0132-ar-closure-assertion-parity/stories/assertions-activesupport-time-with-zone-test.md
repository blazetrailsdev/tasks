---
title: "assertions-activesupport-time-with-zone-test"
status: draft
updated: 2026-09-15
rfc: "0132-ar-closure-assertion-parity"
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

Split from `assertions-activesupport-time-zone-and-travel` (did not fit the PR ceiling).
`vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb` vs
`packages/activesupport/src/core-ext/time-with-zone.test.ts` measured 78 assertion-count,
86 kind, 13 value mismatches (`pnpm parity:test -- --assertions --missing --package activesupport | grep time_with_zone_test`).
Likely larger than one PR: ship per describe block and file the rest.

## Acceptance criteria

- time_with_zone_test.rb reports 0 count/kind/value mismatches (or the unshipped remainder is filed).
- activesupport row of `scripts/test-compare/assertion-mismatch-mark.json` lowered by exactly this contribution.
- No test name changes.
