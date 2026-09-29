---
title: "Port TestHelper's performed-job assertions and perform_enqueued_jobs, with NotTestAdapterTest"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-test-helper-enqueued-assertions"]
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

The second half of `vendor/rails/v8.0.2/activejob/lib/active_job/test_helper.rb`, and the last thing RFC 0116 waits on
(`perform_enqueued_jobs` appears 21 times in
`vendor/rails/v8.0.2/activerecord/test/activejob/destroy_association_async_test.rb`):

- `assert_performed_jobs` (`:278-295`), `assert_no_performed_jobs` (`:348-352`);
- `assert_performed_with` (`:510-556`);
- `perform_enqueued_jobs(only:, except:, queue:, at:, &block)` (`:620-655`);
- `performed_jobs_with` (`:720-722`) and `flush_enqueued_jobs` (`:724-730`).

`vendor/rails/v8.0.2/activejob/test/cases/test_helper_test.rb` `NotTestAdapterTest` (`unless adapter_is?(:test)`, `:2115-2169`): 8 cases, as `parity:test` names them:

- [ ] `:2121` NotTestAdapterTest — "assert_enqueued_jobs raises"
- [ ] `:2127` NotTestAdapterTest — "assert_no_enqueued_jobs raises"
- [ ] `:2133` NotTestAdapterTest — "assert_performed_jobs raises"
- [ ] `:2139` NotTestAdapterTest — "assert_no_performed_jobs raises"
- [ ] `:2145` NotTestAdapterTest — "assert_enqueued_with raises"
- [ ] `:2151` NotTestAdapterTest — "assert_performed_with raises"
- [ ] `:2157` NotTestAdapterTest — "perform_enqueued_jobs without a block"
- [ ] `:2163` NotTestAdapterTest — "perform_enqueued_jobs with a block does not raise"

`AdapterIsNotTestAdapterTest` (`:2171-2183`): 1 case, as `parity:test` names them:

- [ ] `:2176` AdapterIsNotTestAdapterTest — "perform enqueued jobs just yields"

## Fidelity traps (predicted at authoring)

- [ ] **`perform_enqueued_jobs` without a block** returns `flush_enqueued_jobs(...)`'s count (`:622-625`) after `require_active_job_test_adapter!`; with a block on a non-test adapter it only runs `_assert_nothing_raised_or_warn` (`:627`, already async at `assertions.ts:213`).
- [ ] **Save / set / `ensure` restore of six settings** (`:631-654`) must be a `try` / `finally` around the awaited block.
- [ ] **`flush_enqueued_jobs`** deletes each payload from `enqueued_jobs`, appends it to `performed_jobs`, then awaits `instantiate_job(payload, skip_deserialize_arguments: true).perform_now`; the returned value is the selected count (`.count` of `jobs_with`'s result), not the number that succeeded.
- [ ] **`assert_performed_jobs` with a block** counts `performed_jobs.size` before and after `perform_enqueued_jobs` (`:282-290`); without a block it counts `performed_jobs_with(...)`.
- [ ] **`assert_performed_with`** mirrors `assert_enqueued_with`: `.compact`, callable matchers, `rbEqual`, `rbInspect` message, and `instantiate_job(matching_job)` as the return value.

## Acceptance criteria

- [ ] Every `test_helper.rb` member reads complete in `parity:api` with the enqueued story.
- [ ] The 9 cases above pass in the `inline` and `async` lanes (and skip, as in Rails, in the `test` lane).
- [ ] After `await performEnqueuedJobs(async () => {{ …; await x; … }})` the adapter's six settings are restored, and they were not restored before the block settled.

## Definition of done

A `perform_enqueued_jobs` that restores the adapter's settings before its block settles does not close this story.
