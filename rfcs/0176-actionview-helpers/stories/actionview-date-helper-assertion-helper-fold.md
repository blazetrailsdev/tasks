---
title: "actionview-date-helper-assertion-helper-fold"
status: in-progress
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9199
claim: "2026-10-21T22:29:25Z"
assignee: "actionview-api-residue-context-rendering-class-methods"
blocked-by: null
closed-reason: null
---

# test-compare: fold date_helper_test's assert_distance_of_time_in_words helper

## Context

`pnpm parity:test --package actionview --assertions --missing` (2026-10-21) flags `template/date_helper_test.rb › distance in words — equal rails 0 vs trails 24 [unmapped: rails:assert_distance_of_time_in_words]`. This is a **comparer artifact**: the Rails test calls a test-file helper `assert_distance_of_time_in_words` (`vendor/rails/v8.0.2/actionview/test/template/date_helper_test.rb`) whose body is `assert_equal`s, and the comparer does not fold it. The port inlines the same assertions. The one count mismatch in the file is the same test.

## Acceptance criteria

- Either the port keeps the helper at its Rails name (`assertDistanceOfTimeInWords`) and the comparer folds it on both sides, or the comparer folds the Rails helper; the test pairs with 0 count/kind mismatch.
- No assertion-receipts row is added for it.
