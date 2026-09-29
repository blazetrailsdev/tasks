---
title: "Port test_helper_test.rb PerformedJobsTest cases 71–126"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-test-helper-performed-assertions",
    "port-activejob-exceptions-retry-and-discard",
    "port-activejob-globalid-arguments-and-rescue-tests",
  ]
deps-rfc: []
est-loc: 600
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/test/cases/test_helper_test.rb` `PerformedJobsTest`
cases **71–126** (`:1523-2112`), from
`test_assert_performed_jobs_with_except_and_queue_options` to the end of the
class. They cover the `assert_no_performed_jobs` option matrix (from `:1611`),
and `assert_performed_with` with `at:`, `priority:`, `queue:`, proc and
GlobalID `args:` matchers, and its failure messages.

It is independent of `…-first-half`. Both depend only on the lib stories and
can run in parallel. Keep `def test_x` names. The failure-message cases use
`rbInspect`, as in `port-activejob-test-helper-test-enqueued-jobs`.

If the port runs past 600 LOC, the agreed split point is
`test_assert_no_performed_jobs_without_block_with_except_and_queue_options`
(`:1802`): cases 71–98 (`:1523-1801`) and 99–126 (`:1802-2112`). File the tail
as a sibling story in this RFC.

## Acceptance criteria

- [ ] 56 cases ported under their Rails names, passing in the `test` lane.
- [ ] With the first half and the performed-assertions story,
      `PerformedJobsTest` is at 126/126 in `parity:test`.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR. If the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
