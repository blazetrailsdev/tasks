---
title: "Port test_helper_test.rb EnqueuedJobsTest cases 1\u201338 (:40-432)"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-test-helper-enqueued-assertions",
    "port-activejob-exceptions",
    "port-activejob-test-fixture-jobs",
  ]
deps-rfc: []
est-loc: 400
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/test/cases/test_helper_test.rb` `EnqueuedJobsTest` (`:38-808`, inside `if adapter_is?(:test)`, `:39`) has 76 cases; this story ports 1–38, the `assert_enqueued_jobs` / `assert_no_enqueued_jobs` option matrix. The `DoNotPerformEnqueuedJobs` concern (`:17-35`) is ported here as the shared helper the class includes.

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/test_helper_test.rb`: 38 cases, as `parity:test` names them:

- [ ] `:42` EnqueuedJobsTest — "assert enqueued jobs"
- [ ] `:50` EnqueuedJobsTest — "repeated enqueued jobs calls"
- [ ] `:65` EnqueuedJobsTest — "assert enqueued jobs message"
- [ ] `:76` EnqueuedJobsTest — "assert enqueued jobs with no block"
- [ ] `:89` EnqueuedJobsTest — "assert no enqueued jobs with no block"
- [ ] `:95` EnqueuedJobsTest — "assert no enqueued jobs"
- [ ] `:103` EnqueuedJobsTest — "assert enqueued jobs too few sent"
- [ ] `:113` EnqueuedJobsTest — "assert enqueued jobs too many sent"
- [ ] `:124` EnqueuedJobsTest — "assert no enqueued jobs failure"
- [ ] `:134` EnqueuedJobsTest — "assert enqueued jobs with only option"
- [ ] `:144` EnqueuedJobsTest — "assert enqueued jobs with only option as proc"
- [ ] `:154` EnqueuedJobsTest — "assert enqueued jobs with except option"
- [ ] `:164` EnqueuedJobsTest — "assert enqueued jobs with except option as proc"
- [ ] `:174` EnqueuedJobsTest — "assert enqueued jobs with only and except option"
- [ ] `:186` EnqueuedJobsTest — "assert enqueued jobs with only and queue option"
- [ ] `:196` EnqueuedJobsTest — "assert enqueued jobs with except and queue option"
- [ ] `:206` EnqueuedJobsTest — "assert enqueued jobs with only and except and queue option"
- [ ] `:218` EnqueuedJobsTest — "assert enqueued jobs with queue option"
- [ ] `:229` EnqueuedJobsTest — "assert enqueued job with priority option"
- [ ] `:241` EnqueuedJobsTest — "assert enqueued jobs with only option and none sent"
- [ ] `:251` EnqueuedJobsTest — "assert enqueued jobs with except option and none sent"
- [ ] `:261` EnqueuedJobsTest — "assert enqueued jobs with only and except option and none sent"
- [ ] `:271` EnqueuedJobsTest — "assert enqueued jobs with only option and too few sent"
- [ ] `:282` EnqueuedJobsTest — "assert enqueued jobs with except option and too few sent"
- [ ] `:293` EnqueuedJobsTest — "assert enqueued jobs with only and except option and too few sent"
- [ ] `:304` EnqueuedJobsTest — "assert enqueued jobs with only option and too many sent"
- [ ] `:314` EnqueuedJobsTest — "assert enqueued jobs with except option and too many sent"
- [ ] `:324` EnqueuedJobsTest — "assert enqueued jobs with only and except option and too many sent"
- [ ] `:334` EnqueuedJobsTest — "assert enqueued jobs with only option as array"
- [ ] `:344` EnqueuedJobsTest — "assert enqueued jobs with except option as array"
- [ ] `:354` EnqueuedJobsTest — "assert enqueued jobs with only and except option as array"
- [ ] `:366` EnqueuedJobsTest — "assert no enqueued jobs with only option"
- [ ] `:374` EnqueuedJobsTest — "assert no enqueued jobs with except option"
- [ ] `:382` EnqueuedJobsTest — "assert no enqueued jobs with only and except option"
- [ ] `:392` EnqueuedJobsTest — "assert no enqueued jobs with only option failure"
- [ ] `:403` EnqueuedJobsTest — "assert no enqueued jobs with except option failure"
- [ ] `:414` EnqueuedJobsTest — "assert no enqueued jobs with only and except option failure"
- [ ] `:425` EnqueuedJobsTest — "assert no enqueued jobs with only option as array"

## Acceptance criteria

- [ ] All 38 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
