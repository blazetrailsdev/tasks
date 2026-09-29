---
title: "Port test_helper_test.rb EnqueuedJobsTest cases 25–76"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-test-helper-enqueued-assertions",
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

`vendor/rails/v8.0.2/activejob/test/cases/test_helper_test.rb` `EnqueuedJobsTest`
(`:38-807`, inside `if adapter_is?(:test)`, `:39`) has 76 cases.
`port-activejob-test-helper-enqueued-assertions` ports cases 1–24
(`:40-292`). This story ports cases **25–76** (`:293-806`), from
`test_assert_enqueued_jobs_with_only_and_except_option_and_too_few_sent` to the
end of the class. That covers the `assert_no_enqueued_jobs` option matrix
(`:392-460`), and the `assert_enqueued_with` family with its `at:`,
`priority:`, `queue:` and `args:` proc matchers, keyword arguments, and
GlobalID arguments (`:718-770`). The last group needs `models/person` from
`port-activejob-globalid-arguments-and-rescue-tests`, hence the dep.

These are pure test ports against already-ported lib code. A failure is a lib
bug to fix in this PR, not a test to rename or skip. Keep the `def test_x`
names so test-compare's `def_test` mapping credits them.

The failure-message cases assert Ruby `inspect` output, for example
`"No enqueued job found with #{{ job: HelloJob, args: [wilma] }}"` (`:739`),
which renders under Ruby 3.3.11's `Hash#inspect`. Build the expected strings
with `rbInspect`, not hand-typed JS object text.

If the port runs past 600 LOC, the agreed split point is
`test_assert_no_enqueued_jobs_and_perform_now` (`:542`): cases 25–50
(`:293-541`) and 51–76 (`:542-806`). File the tail as a sibling story in this
RFC.

## Acceptance criteria

- [ ] 52 cases ported under their Rails names, passing in the `test` lane.
- [ ] Together with the enqueued-assertions story, `EnqueuedJobsTest` is at
      76/76 in `parity:test`.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR. If the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
