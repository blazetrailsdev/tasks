---
title: "test:compare — compare assertion kinds/expectations, not just counts"
status: claimed
updated: 2026-07-02
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-07-02T01:18:05Z"
assignee: "assertion-expectation-kind-comparison"
blocked-by: null
---

## Context

Follow-up from PR #4372, which is explicitly **count-only** (report-only,
activerecord-scoped). The PR compares the _number_ of assertion calls between a
matched Rails test and its trails port, but NOT what each assertion checks. A
count match can hide a semantic divergence: e.g. Rails `assert_equal x, foo`
(equality) vs trails `expect(foo).toBeTruthy()` (truthiness) both count 1.

The plumbing already exists: `TestCaseInfo.assertions: string[]` holds the
**deduped assertion kinds** on both extractors (`find_assertions` /
the TS walk), alongside the raw `assertionCount` this story would consume.

## Acceptance criteria

- For matched, implemented pairs, compute an assertion-**kind histogram** diff
  (e.g. Rails `{assert_equal:2, assert_nil:1}` vs trails
  `{expect:3}` normalized to comparable kinds where a mapping exists).
- Surface kind divergences in a new report section (informational, no gate),
  reusing the existing `--assertions` / JSON plumbing and the
  `ASSERTION_REPORT_PACKAGES` scope.
- Define/normalize the Rails-kind → trails-matcher mapping (assert_equal↔toEqual,
  assert_nil↔toBeNull, assert↔toBeTruthy, …); document unmapped kinds.
- Note (do not necessarily implement) literal expected-value comparison as a
  further phase.
- Extractor/report unit tests for the histogram diff.
