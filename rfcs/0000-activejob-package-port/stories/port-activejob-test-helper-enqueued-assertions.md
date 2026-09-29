---
title: "Port TestHelper's setup/teardown and enqueued-job assertions, and ActiveJob::TestCase"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-test-and-async-adapters"]
deps-rfc: []
est-loc: 550
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/test_helper.rb` is 770 lines,
mostly RDoc. It is split across two stories. This one ports the machinery and
the **enqueued** half:

- `TestQueueAdapter` (`:15-35`): `class_attribute :_test_adapter`, a
  `queue_adapter` override, `disable_test_adapter` and
  `enable_test_adapter`. It is included into `Base` by
  `ActiveSupport.on_load(:active_job)` (`:37-39`). That is a load hook, not a
  static include, so loading the test helper patches `Base`.
- `before_setup` / `after_teardown` (`:41-64`), wired through activesupport's
  `beforeSetup` / `afterTeardown`
  (`packages/activesupport/src/testing/setup-and-teardown.ts:19,23`), and
  `queue_adapter_for_test` (`:66-67`).
- `assert_enqueued_jobs` (`:122-139`), `assert_no_enqueued_jobs`
  (`:186-190`) and `assert_enqueued_with` (`:406-452`). The last builds the
  "No enqueued job found with …" / "Potential matches:" message from Ruby
  `inspect` (`:440-448`). Render it with `rbInspect`, because
  `test_helper_test.rb:739-740` asserts on it.
- `queue_adapter` (`:661-664`) and the shared private helpers
  `require_active_job_test_adapter!`, `using_test_adapter?`,
  `clear_enqueued_jobs`, `clear_performed_jobs`, `jobs_with`,
  `filter_as_proc`, `enqueued_jobs_with`, `prepare_args_for_assertion`,
  `deserialize_args_for_assertion`, `instantiate_job`,
  `queue_adapter_changed_jobs` and `validate_option` (`:666-769`).
  `performed_jobs_with` and `flush_enqueued_jobs` belong to the performed
  story.

`lib/active_job/test_case.rb` (11 lines) is `class TestCase <
ActiveSupport::TestCase`, `include TestHelper`, and
`run_load_hooks(:active_job_test_case, self)`. It builds on
`packages/activesupport/src/test-case.ts:53`.

Every block-taking assertion is `async` and awaits its block (RFC "Async
shape"), like `assertDifference`. The `only:` / `except:` / `queue:` options
are kwargs: port them as an options bag, keeping Ruby's `nil`-versus-absent
semantics (CLAUDE.md "kwargs").

Tests, from `test/cases/test_helper_test.rb` (`EnqueuedJobsTest` is inside `if
adapter_is?(:test)`, `:39`, so these run in the `test` lane):

- the `DoNotPerformEnqueuedJobs` concern (`:17-35`), as a shared helper;
- `EnqueuedJobsTest` cases 1–24 (`:40-292`, through
  `test_assert_enqueued_jobs_with_except_option_and_too_few_sent`);
- `QueueAdapterTest` (`:809-825`, 1), `OverrideQueueAdapterTest`
  (`:2185-2195`, 1) and `InheritedJobTest` (`:2197-2201`, 1, with the
  `inherited_job` / `queue_adapter_job` fixtures);
- `test/cases/test_case_test.rb`'s remaining 2 cases, including the adapter
  `case` in `test_set_test_adapter` (`:22-51`). Port all eleven `when` arms.
  The gem-adapter arms read their constants from the `QueueAdapters`
  namespace at call time, and no trails lane reaches them.

**Unported:** `QueueAdapterJobTest#test_queue_adapter_is_is_inline_adapter_because_it_is_set_on_the_job_class`
(`:2203-2213`) drives `Zeitwerk.with_loader`. Add a per-test entry to
`scripts/parity/unported-files/activejob.ts` citing CLAUDE.md § "Trails has no
autoloader".

`port-activejob-test-helper-test-enqueued-jobs` ports `EnqueuedJobsTest`
cases 25–76.

## Acceptance criteria

- [ ] `test_helper.rb`'s members above and `test_case.rb` read complete in
      `parity:api`.
- [ ] The 29 cases above pass in the `test` lane and are skipped by the guard
      in the `inline` / `async` lanes, as in Rails.
- [ ] A class that sets its own `queue_adapter` (`InheritedJob`) keeps it, and
      every other class gets a fresh `TestAdapter` per test.
