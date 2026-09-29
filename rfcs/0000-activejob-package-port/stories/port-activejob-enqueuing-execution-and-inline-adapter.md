---
title: "Port Enqueuing, Execution, QueueAdapter lookup and InlineAdapter, async, and ratify the shape in CLAUDE.md"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-core-queue-name-and-priority"]
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

This story makes a job runnable. RFC 0116's
`port-after-commit-jobs-callback` depends on it for `perform_later`.

Rails files, under `vendor/rails/v8.0.2/activejob/lib/active_job/`:

- `enqueuing.rb:8-139`: `EnqueueError` (`:8`); `ActiveJob.perform_all_later`
  (`:14-37`), which groups by adapter and calls `enqueue_all` or falls back to
  `enqueue` / `enqueue_at` under `instrument_enqueue_all`;
  `class_attribute :enqueue_after_transaction_commit` (`:53`);
  `ClassMethods#perform_later` (`:81-89`) and `job_or_instantiate` (`:91-93`);
  `enqueue(options = {})` (`:112-125`), which runs `run_callbacks :enqueue` and
  sets `successfully_enqueued`; and `raw_enqueue` (`:128-138`), which rescues
  `EnqueueError` into `enqueue_error`.
- `execution.rb:12-71`: `include ActiveSupport::Rescuable` (`:14`);
  `ClassMethods#perform_now(...)` (`:22-24`) and `execute(job_data)`
  (`:26-33`), which runs the `ActiveJob::Callbacks` `:execute` chain;
  `perform_now` (`:45-57`), which increments `executions`, calls
  `deserialize_arguments_if_needed`, `_perform_job` and `rescue_with_handler`;
  `perform(*)` raising `NotImplementedError` (`:60-62`); and `_perform_job`
  (`:65-70`), which runs `run_callbacks :perform { perform(*arguments) }`.
  `execute` is `ActiveJob::Callbacks.run_callbacks(:execute) { … }`
  (`:27-32`), so this story also lands `callbacks.rb:22-25`: the
  `ActiveJob::Callbacks` module with `define_callbacks :execute` on its
  singleton. The rest of `callbacks.rb` is
  `port-activejob-callbacks-timezones-and-translation`'s.
- `queue_adapter.rb:6-77`: `ActiveJob.adapter_name` (`:7-14`); the
  `_queue_adapter_name` / `_queue_adapter` class_attributes (`:24-25`);
  `queue_adapter` / `queue_adapter_name` / `queue_adapter=` (`:34-60`), where
  `queue_adapter=` accepts a name or an instance and raises `ArgumentError` on
  nonsense; and the private `assign_adapter` / `queue_adapter?` (`:66-76`).
- `queue_adapters.rb:112-139`: the `QueueAdapters` namespace, extended with
  `ActiveSupport::Autoload` (`:113`), and `lookup(name)` (`:135-137`). Only the
  in-process adapters get `autoload` lines (RFC "Where the non-ports are
  recorded").
- `queue_adapters/abstract_adapter.rb` (19 lines) and `inline_adapter.rb`
  (23 lines). `InlineAdapter#enqueue` is `Base.execute(job.serialize)`
  (`:14-16`), and `enqueue_at` raises `NotImplementedError` (`:18-20`).

**The async shape (RFC "Async shape").** `perform_now`, `execute`,
`_perform_job`, `enqueue`, `raw_enqueue`, `perform_later` and
`perform_all_later` are `async`. An adapter's `enqueue` / `enqueue_at` /
`enqueue_all` may return a promise, and every caller awaits it.
`perform_later`'s block (`:85`, `yield job if block_given?`) is captured and
awaited before the method returns, following CLAUDE.md § "A create path
awaits its block before saving". `job_or_instantiate`, `set` and `serialize`
stay sync.

**Ratify it.** Add a CLAUDE.md section to trails, "A job's `perform` and
`enqueue` are async (`perform_now` / `perform_later`)", in the same shape as
§ "A create path awaits its block before saving". It records the Rails bodies
above, the language shortcoming, why sync plus an escape hatch was rejected
(RFC "Alternatives considered"), and the list of sync members. Later stories
cite it instead of re-deriving the decision.

**Test setup.** Port `test/helper.rb` (27 lines) and `test/adapters/inline.rb`
as the `AJ_ADAPTER=inline` lane's vitest setup file, with `adapter_is?`
(`helper.rb:21-23`) as a helper. `GlobalID.app = "aj"` (`:7`) is set there.
`ActiveJob::Base.include(ActiveJob::EnqueueAfterTransactionCommit)` (`:27`) is
added by `port-activejob-enqueue-after-transaction-commit`.

Tests:

- `test/cases/queuing_test.rb`: all 12 except `"perform_all_later
instrumentation"` (`:88-104`), which goes to
  `port-activejob-instrumentation-and-log-subscriber`;
- `test/cases/queue_adapter_test.rb`: all 6;
- `test/cases/adapter_test.rb`: `"should load #{ENV['AJ_ADAPTER']} adapter"`
  (`:6-8`). The two sucker_punch cases are recorded as unported by
  `enroll-activejob-in-compare-tooling`;
- the perform_now / perform_later halves of `queue_naming_test.rb`
  (`:151-161`) and `queue_priority_test.rb` (`:50-60`).

## Acceptance criteria

- [ ] `enqueuing.rb`, `execution.rb`, `queue_adapter.rb`, `queue_adapters.rb`,
      `abstract_adapter.rb` and `inline_adapter.rb` read complete in
      `parity:api`.
- [ ] The CLAUDE.md section exists, and each async member's JSDoc cites it.
- [ ] The cases above pass in the `inline` lane.
- [ ] `QueueAdapters.lookup("sidekiq")` raises the same `NameError` a Ruby
      process without the gem raises. It does not return a stub.
- [ ] `await HelloJob.performLater("x", (job) => …)` awaits an async block
      before it resolves.
