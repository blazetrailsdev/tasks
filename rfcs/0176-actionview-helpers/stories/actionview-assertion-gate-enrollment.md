---
title: "actionview-assertion-gate-enrollment"
status: done
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps:
  - actionview-number-helper-test-assertions
  - actionview-tag-helper-test-assertions
  - actionview-truthy-falsy-assertion-kinds
  - actionview-text-javascript-helper-test-assertions
  - actionview-date-helper-assertion-helper-fold
deps-rfc: []
est-loc: 20
priority: null
pr: trails#9227
claim: "2026-10-22T16:21:27Z"
assignee: "actionview-assertion-gate-enrollment"
blocked-by: null
closed-reason: null
---

# Enroll actionview in the assertion gate

## Context

The actionview assertion debt (136 mismatches on 2026-10-21) was classified by `actionview-assertion-parity-measure-and-split`: one comparer artifact (`date_helper_test.rb`, story `actionview-date-helper-assertion-helper-fold`) and four real-miss stories (`actionview-number-helper-test-assertions`, `actionview-tag-helper-test-assertions`, `actionview-truthy-falsy-assertion-kinds`, `actionview-text-javascript-helper-test-assertions`). Once those land, actionview's count is at or near 0 and it can join the assertion gate's enrolled set (only-grow), as RFC 0132 did for the AR closure.

## Acceptance criteria

- actionview is added to the assertion gate's enrolled packages with its mark at the measured count.
- `pnpm parity:test:assertions` is green.
