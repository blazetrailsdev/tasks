---
title: "Port TestHelper's performed-job assertions and perform_enqueued_jobs"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-test-helper-enqueued-assertions"]
deps-rfc: []
est-loc: 500
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This is the second half of
`vendor/rails/v8.0.2/activejob/lib/active_job/test_helper.rb`, and the last
thing RFC 0116 waits on. `perform_enqueued_jobs` appears 21 times in
`vendor/rails/v8.0.2/activerecord/test/activejob/destroy_association_async_test.rb`.

- `assert_performed_jobs` (`:278-295`), which runs `perform_enqueued_jobs` over
  the block and diffs `performed_jobs.size`, and `assert_no_performed_jobs`
  (`:348-352`).
- `assert_performed_with` (`:510-556`), with the "No performed job found with …"
  / "Potential matches:" message rendered through `rbInspect`, as in the
  enqueued half.
- `perform_enqueued_jobs(only:, except:, queue:, at:, &block)` (`:620-655`).
  Without a block it returns `flush_enqueued_jobs` (`:622-625`). If the adapter
  is not a test adapter it runs `_assert_nothing_raised_or_warn` (`:627`).
  Otherwise it saves six adapter settings, sets them, runs the block, and
  restores them in an `ensure` (`:631-654`). Port the method as `async` with
  a `try` / `finally` around the awaited block, so the restore happens on
  settle. `_assert_nothing_raised_or_warn` is activesupport's, already async
  (`packages/activesupport/src/testing/assertions.ts:213`).
- `performed_jobs_with` (`:720-722`) and `flush_enqueued_jobs` (`:724-730`),
  which moves each payload from `enqueued_jobs` to `performed_jobs` and awaits
  `instantiate_job(payload, skip_deserialize_arguments: true).perform_now`.

Tests, from `test/cases/test_helper_test.rb`:

- `PerformedJobsTest` (`if adapter_is?(:test)`, `:828`) cases 1–18
  (`:829-996`, through
  `test_perform_enqueued_jobs_without_block_with_except_and_queue_options`);
- `NotTestAdapterTest` (`unless adapter_is?(:test)`, `:2115-2169`): 8 cases.
  These run in the `inline` and `async` lanes;
- `AdapterIsNotTestAdapterTest` (`:2171-2183`): 1 case.

Cases 19–126 of `PerformedJobsTest` are
`port-activejob-test-helper-test-performed-jobs-first-half` and
`…-second-half`.

## Acceptance criteria

- [ ] Every `test_helper.rb` member reads complete in `parity:api`, together
      with the enqueued story.
- [ ] The 27 cases above pass in their lanes.
- [ ] After `await performEnqueuedJobs(async () => { …; await x; … })`, the
      adapter's six settings are restored, and they were not restored before
      the block settled.
