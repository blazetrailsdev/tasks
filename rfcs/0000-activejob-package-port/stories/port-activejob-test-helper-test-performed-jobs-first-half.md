---
title: "Port test_helper_test.rb PerformedJobsTest cases 19–70"
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
(`:827-2113`, inside `if adapter_is?(:test)`, `:828`) has 126 cases.
`port-activejob-test-helper-performed-assertions` ports cases 1–18. This story
ports cases **19–70** (`:997-1522`), from
`test_perform_enqueued_jobs_with_at_with_job_performed_now` to
`test_assert_performed_jobs_without_block_with_only_and_queue_options_failure`.

They cover `perform_enqueued_jobs` with `at:`, nested and repeated calls,
jobs that raise (`test_perform_enqueued_jobs_properly_count_job_that_raises`,
`:1045`), retries (`test_perform_enqueued_jobs_dont_perform_retries`, `:1055`,
over `RaisingJob`), `RescueJob` (`:1090`, `:1319-1339`), and the
`assert_performed_jobs` matrix with and without a block. `RaisingJob`'s retry
needs the exceptions story. The `rescue_job` fixture lands with
`port-activejob-globalid-arguments-and-rescue-tests`. Hence the two deps.

Pure test ports: a failure is a lib bug to fix in this PR. Keep `def test_x`
names.

## Acceptance criteria

- [ ] 52 cases ported under their Rails names, passing in the `test` lane.
