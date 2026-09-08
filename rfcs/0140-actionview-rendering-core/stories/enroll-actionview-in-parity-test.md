---
title: "Enrol actionview in parity:test"
status: ready
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 300
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

actionview is measured by `parity:api` but is **absent from the compared test
population**. `pnpm parity:test` reports seven packages — arel, activemodel,
activerecord, activesupport, rack, actiondispatch, actioncontroller — and
actionview is not among them, so its 39 test files credit nothing and its gap
against Rails' actionview suite is unknown.

`PKG_SRC_DIRS` in `scripts/test-compare/compare.ts:1499-1518` already carries an
`actionview` row, so the source root is registered; what is missing is the rest
of the enrolment.

Enrolment is more than one registration. Per the repo's own history it is four,
plus two ratchets that must be seeded in the same PR or CI goes red on a branch
that looks green locally:
`scripts/test-compare/` package list, the stub generator, the gate manifest, the
convention manifest, then the assertion mark and the test-name mark.

Prior art: `rails-test-name-parity-rollout-actionview` (RFC 0127, draft) covers
the test-name half of this. **Read it before starting** and either fold this
story into it or scope this one to the enrolment proper — do not land two PRs
that both seed the same mark.

## Converged shape

Enrol actionview across every registration point, seed the marks at the measured
values with the before/after in the PR body, and report the resulting figure.

Expect the first measurement to be poor and do not chase it in this story: the
number is the deliverable, not a target.

## Acceptance criteria

- `pnpm parity:test` prints an `actionview` row with a real coverage figure.
- `pnpm parity:test:assertions` is green with actionview's mark seeded at the
  measured value, not above it.
- The PR body carries the all-package before/after showing no other package's
  counters moved.
- The relationship to `rails-test-name-parity-rollout-actionview` is stated in
  the PR body — folded in, or explicitly scoped apart.
