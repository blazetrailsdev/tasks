---
title: "Port TestHelper's setup/teardown and enqueued-job assertions, ActiveJob::TestCase, and test_case_test.rb"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-test-adapter", "port-activejob-test-fixture-jobs"]
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

`vendor/rails/v8.0.2/activejob/lib/active_job/test_helper.rb` (770 lines, mostly RDoc), split across two stories. This
one ports:

- `TestQueueAdapter` (`:15-35`): `class_attribute :_test_adapter`, `queue_adapter`
  override, `disable_test_adapter`, `enable_test_adapter`; included into `Base`
  by `ActiveSupport.on_load(:active_job)` (`:37-39`).
- `before_setup` / `after_teardown` (`:41-64`), wired through
  `packages/activesupport/src/testing/setup-and-teardown.ts:19,23`, and
  `queue_adapter_for_test` (`:66-67`).
- `assert_enqueued_jobs` (`:122-139`), `assert_no_enqueued_jobs` (`:186-190`),
  `assert_enqueued_with` (`:406-452`).
- `queue_adapter` (`:661-663`) and the shared private helpers
  `require_active_job_test_adapter!`, `using_test_adapter?`,
  `clear_enqueued_jobs`, `clear_performed_jobs`, `jobs_with`, `filter_as_proc`,
  `enqueued_jobs_with`, `prepare_args_for_assertion`,
  `deserialize_args_for_assertion`, `instantiate_job`,
  `queue_adapter_changed_jobs`, `validate_option` (`:666-768`).

`vendor/rails/v8.0.2/activejob/lib/active_job/test_case.rb` (11 lines): `TestCase < ActiveSupport::TestCase`, `include
TestHelper`, `run_load_hooks(:active_job_test_case, self)`, over
`packages/activesupport/src/test-case.ts:53`.

Every block-taking assertion is `async` and awaits its block, as `assertDifference`
does (`packages/activesupport/src/testing/assertions.ts:183`). The Rails
`test_helper_test.rb` cases are the five `port-activejob-test-helper-test-*`
stories.

`vendor/rails/v8.0.2/activejob/test/cases/test_case_test.rb`: 3 cases, as `parity:test` names them:

- [ ] `:18` ActiveJobTestCaseTest — "include helper"
- [ ] `:22` ActiveJobTestCaseTest — "set test adapter"
- [ ] `:53` ActiveJobTestCaseTest — "does not perform enqueued jobs by default"

`test_set_test_adapter` (`:22-51`) is an eleven-arm `case` over adapter names.
Port all eleven arms; the gem-adapter arms read their constants from the
`QueueAdapters` namespace at call time, and no trails lane reaches them.

## Fidelity traps (predicted at authoring)

- [ ] **`queue_adapter_changed_jobs`** (`:759-763`) walks `ActiveJob::Base.descendants` and keeps classes whose singleton class defines its own `_queue_adapter`. trails has no `inherited`: `DescendantsTracker.registerSubclass` is called only where trails records a subclass (`packages/activesupport/src/callbacks.ts:964`, `activerecord/src/inheritance.ts:142`). Prove that a job class whose only customization is `self.queue_adapter = :inline` (`InheritedJob`, `QueueAdapterJob`) is found, and read "defines its own `_queue_adapter`" as an own-property check on the class.
- [ ] **`{{ job:, args:, at:, queue:, priority: }}.compact`** (`:409`) drops `nil`s; a matcher value that responds to `call` is invoked (`:428-429`), otherwise compared with Ruby `==` (`rbEqual`, deep for Arrays/Hashes, record equality for models).
- [ ] **`enqueued_jobs - original_enqueued_jobs`** (`:418`) is Ruby `Array#-` (hash/eql? equality), not identity.
- [ ] **The failure message** interpolates `#{{expected}}` (Ruby `Hash#inspect`, `rbInspect`), `job["job_class"]` names and `matching_class.join("\n")` (`:440-447`).
- [ ] **`job.fetch(:queue, job_class.queue_name)`** (`:697`) is a stored-value `fetch`, not `??`; **`queue.to_s`** strips a Symbol's colon.
- [ ] **`prepare_args_for_assertion`**: a Symbol `:queue` becomes a String (`:734-736`); an `at:` that `acts_like?(:time)` becomes a `±1` second range matcher (`:738-741`).
- [ ] **`Time.at(new_job[:at])`** (`:747`, `:754`) from float seconds; `payload.key?(:at)` (`:754`) is key presence, not truthiness.
- [ ] **Bang arm.** `require_active_job_test_adapter!` raises `ArgumentError` "#{{method}} requires the Active Job test adapter, you're using #{{queue_adapter.class.name}}." (`:668`).
- [ ] **`validate_option`** (`:767`) raises `ArgumentError` with the message ``Cannot specify both `:only` and `:except` options.`` when `only && except`, which is Ruby truthiness.
- [ ] **`before_setup` / `after_teardown` call `super`**, and `after_teardown` runs after the test's own teardown.

## Acceptance criteria

- [ ] Every member above and `test_case.rb` read complete in `parity:api`.
- [ ] The 3 `test_case_test.rb` cases pass in their lanes.

## Definition of done

Deleting an `adapter_is?(:test)` guard so cases run in the `inline` lane does not close this story.
