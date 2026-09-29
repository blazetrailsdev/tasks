---
title: "Port TestAdapter and AsyncAdapter, and add the test / async CI lanes"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob", "ruby-compat"]
deps: ["port-activejob-enqueuing-execution-and-inline-adapter"]
deps-rfc: []
est-loc: 450
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**`TestAdapter`** (`vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapters/test_adapter.rb`,
86 lines) has six `attr_accessor`s (`perform_enqueued_jobs`,
`perform_enqueued_at_jobs`, `filter`, `reject`, `queue`, `at`, `:15`), the
lazy `enqueued_jobs` / `performed_jobs` (`:19-26`), `enqueue` / `enqueue_at`
(`:28-36`), and the private `job_to_hash` (`:39-46`), `perform_or_enqueue`
(`:48-55`) and `filtered?` / `filtered_time?` / `filtered_queue?` /
`filtered_job_class?` / `filter_as_proc` (`:57-84`). `perform_or_enqueue`
awaits `Base.execute`.

`job_to_hash` mixes Symbol keys (`:job`, `:args`, `:queue`, `:priority`, and
`:at` from `extras`) with the String keys `serialize` produces (`"arguments"`,
`"queue_name"`). Apply CLAUDE.md's `symbolize_keys` rule: the hash is bare-keyed
unless Symbol-ness is observable. `TestHelper#assert_enqueued_with` renders
these hashes with `inspect` in its failure message ("Potential matches:",
`test_helper.rb:440-450`), and `test_helper_test.rb` asserts on that message
(`:739-740`). Decide the spelling against those assertions, and write the decision
at `job_to_hash`.

**`AsyncAdapter`** (`async_adapter.rb`, 116 lines) has `initialize(**executor_options)`,
`enqueue`, `enqueue_at`, `shutdown(wait:)`, `immediate=` (`:35-58`),
`JobWrapper` (`:63-72`, which does `Base.execute(@job_data)`), and `Scheduler`
(`:74-114`), whose `DEFAULT_EXECUTOR_OPTIONS` is at `:75-82`, with
`enqueue` / `enqueue_at` / `shutdown` / `executor`. The mapping:

- `Concurrent::ThreadPoolExecutor` (`:89`) is ruby-compat's `ThreadPoolExecutor`
  (`packages/ruby-compat/src/thread-pool-executor.ts:14`). Each task already
  runs in a ruby-compat `Thread` (`:53`), so it gets its own execution
  context. RFC 0147's Non-goals assigned exactly that to "whoever ports
  `async_adapter.rb`", and it holds without extra wrapping. Verify it with a
  test that runs two jobs concurrently and checks their `IsolatedExecutionState`.
- `Concurrent::ImmediateExecutor` (`:88`) and `Concurrent::ScheduledTask`
  (`:99`) have no ruby-compat port. Add each to ruby-compat under its
  `@noRailsEquivalent PERMANENT` inventory rule, beside `ThreadPoolExecutor`,
  and do not inline it into the adapter. `ScheduledTask` follows RFC Open
  question 1: a `setTimeout` posting to the executor, `unref`'d, and cleared
  by `shutdown`.
- `ENV.fetch("RAILS_MAX_THREADS", 5).to_i` (`:77`) is read the Ruby way, as a
  stored-value `fetch`, not `??`.

**CI lanes (RFC "Adapter lanes").** Add the `AJ_ADAPTER=test` and
`AJ_ADAPTER=async` invocations of `packages/activejob` beside the `inline`
lane from `activejob-package-skeleton`. Their setup files port
`test/adapters/test.rb` (`queue_adapter = :test`, `perform_enqueued_jobs =
true`, `perform_enqueued_at_jobs = true`) and `test/adapters/async.rb`
(`queue_adapter = :async`, `immediate = true`). `async_adapter_test.rb` runs
only in the async lane (`Rakefile:38-41`).

Tests:

- `test/cases/async_adapter_test.rb`: 2;
- `test/cases/test_case_test.rb` `test_does_not_perform_enqueued_jobs_by_default`
  (`:52-54`);
- every case already ported by earlier stories, re-run in the two new lanes.
  Fix any failure that appears only in one lane in this PR. A failure in one
  lane only means a Rails arm was dropped
  (`project_rails_test_adapter_conditional_dropped_in_port`).

## Acceptance criteria

- [ ] `test_adapter.rb` and `async_adapter.rb` read complete in `parity:api`.
- [ ] CI runs the activejob suite in three lanes, and each lane is green.
- [ ] Two concurrent `AsyncAdapter` jobs see separate execution contexts.
- [ ] `ImmediateExecutor` and `ScheduledTask` live in ruby-compat with
      receipts, and `pnpm parity:api:extra:gate` is green.
