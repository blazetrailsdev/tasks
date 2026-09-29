---
title: "Port test_helper_test.rb EnqueuedJobsTest cases 39\u201376 and the small adapter classes"
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
    "port-activejob-globalid-argument-arm",
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

`EnqueuedJobsTest` cases 39–76: `assert_enqueued_with` with `at:`, `priority:`, `queue:`, proc and GlobalID `args:` matchers (`:718-770`, `Person`), kwargs (`MultipleKwargsJob`) and its failure messages. **Unported:** `QueueAdapterJobTest` (`:2203-2213`) drives `Zeitwerk.with_loader`; add its per-test entry to `scripts/parity/unported-files/activejob.ts` with a reason citing CLAUDE.md § "Trails has no autoloader".

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/test_helper_test.rb`: 38 cases, as `parity:test` names them:

- [ ] `:433` EnqueuedJobsTest — "assert no enqueued jobs with except option as array"
- [ ] `:442` EnqueuedJobsTest — "assert no enqueued jobs with only and except option as array"
- [ ] `:452` EnqueuedJobsTest — "assert no enqueued jobs with queue option"
- [ ] `:461` EnqueuedJobsTest — "assert no enqueued jobs with queue option failure"
- [ ] `:471` EnqueuedJobsTest — "assert no enqueued jobs with only and queue option"
- [ ] `:481` EnqueuedJobsTest — "assert no enqueued jobs with only and queue option failure"
- [ ] `:493` EnqueuedJobsTest — "assert no enqueued jobs with except and queue option"
- [ ] `:503` EnqueuedJobsTest — "assert no enqueued jobs with except and queue option failure"
- [ ] `:515` EnqueuedJobsTest — "assert no enqueued jobs with only and except and queue option"
- [ ] `:525` EnqueuedJobsTest — "assert enqueued with"
- [ ] `:531` EnqueuedJobsTest — "assert enqueued with with no block"
- [ ] `:536` EnqueuedJobsTest — "assert enqueued with when queue name is symbol"
- [ ] `:542` EnqueuedJobsTest — "assert no enqueued jobs and perform now"
- [ ] `:548` EnqueuedJobsTest — "assert enqueued with returns"
- [ ] `:559` EnqueuedJobsTest — "assert enqueued with with no block returns"
- [ ] `:569` EnqueuedJobsTest — "assert enqueued with failure"
- [ ] `:590` EnqueuedJobsTest — "assert enqueued with with no block failure"
- [ ] `:604` EnqueuedJobsTest — "assert enqueued with args"
- [ ] `:612` EnqueuedJobsTest — "assert enqueued with supports matcher procs"
- [ ] `:634` EnqueuedJobsTest — "assert enqueued with time"
- [ ] `:643` EnqueuedJobsTest — "assert enqueued with date time"
- [ ] `:652` EnqueuedJobsTest — "assert enqueued with time with zone"
- [ ] `:661` EnqueuedJobsTest — "assert enqueued with time and time precision"
- [ ] `:676` EnqueuedJobsTest — "assert enqueued with with no block args"
- [ ] `:683` EnqueuedJobsTest — "assert enqueued with with at option"
- [ ] `:689` EnqueuedJobsTest — "assert enqueued with with relative at option"
- [ ] `:695` EnqueuedJobsTest — "assert enqueued with with no block with at option"
- [ ] `:700` EnqueuedJobsTest — "assert enqueued with wait until with performed"
- [ ] `:711` EnqueuedJobsTest — "assert enqueued with with hash arg"
- [ ] `:717` EnqueuedJobsTest — "assert enqueued with with global id args"
- [ ] `:724` EnqueuedJobsTest — "assert enqueued with with no block with global id args"
- [ ] `:730` EnqueuedJobsTest — "assert enqueued with failure with global id args"
- [ ] `:743` EnqueuedJobsTest — "show jobs that are enqueued when job is not queued at all"
- [ ] `:757` EnqueuedJobsTest — "shows no jobs enqueued when there are no jobs"
- [ ] `:767` EnqueuedJobsTest — "assert enqueued with failure with no block with global id args"
- [ ] `:779` EnqueuedJobsTest — "assert enqueued with does not change jobs count"
- [ ] `:788` EnqueuedJobsTest — "assert enqueued with with no block does not change jobs count"
- [ ] `:796` EnqueuedJobsTest — "assert enqueued jobs with performed"

`QueueAdapterTest` (`:809-825`): 1 case, as `parity:test` names them:

- [ ] `:820` QueueAdapterTest — "assert_enqueued_with enqueues a job with a queue_adapter and queue_adapter_for_test"

`OverrideQueueAdapterTest` and `InheritedJobTest` (`:2185-2201`): 2 cases, as `parity:test` names them:

- [ ] `:2192` OverrideQueueAdapterTest — "assert job has custom queue adapter set"
- [ ] `:2198` InheritedJobTest — "queue adapter is inline adapter because it is set on the job class"

## Acceptance criteria

- [ ] All 41 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.
- [ ] `parity:test` reads `EnqueuedJobsTest` at 76/76 with part 1, and the Zeitwerk case as unported.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
