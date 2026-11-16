---
title: "solid-queue parity:test sweep: remaining model/unit/integration tests and assertion mismatches"
status: ready
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps:
  [
    "solid-queue-v1-7-2-remaining-drift",
    "solid-queue-limits-concurrency-on-conflict-discard",
    "solid-queue-async-processes-lifecycle-test-v1-7-2",
    "solid-queue-async-supervisor-v1-7-2",
    "solid-queue-fork-mode-unported-register",
    "solid-queue-batch-models-v1-7-2",
    "solid-queue-batch-callbacks-and-lifecycle-v1-7-2",
    "solid-queue-dispatcher-maintenance-v1-7-2",
    "solid-queue-configuration-checks-and-cli-v1-7-2",
  ]
deps-rfc: []
est-loc: 700
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package solid-queue` (2026-11-16) reads 150/388 (38.7%). Files that are partly ported, outside the batch, supervisor, fork, maintenance and configuration stories, are still missing tests:

- `ready_execution_test.rb` 8, `job_test.rb` 9 (+2 extra), `recurring_task_test.rb` 14, `claimed_execution_test.rb` 9, `failed_execution_test.rb` 6.
- `worker_test.rb` 6, `dispatcher_test.rb` 3, `queue_test.rb` 2, `process_test.rb` 1, `scheduler_test.rb` 1, `log_subscriber_test.rb` 1.
- `jobs_lifecycle_test.rb` 1, `concurrency_controls_test.rb` 4 (+1 extra), `lifecycle_hooks_test.rb` 1 skipped, `solid_queue_test.rb` 1.
- These new files have no TS file: `integration/continuation_test.rb` (2), `unit/fiber_pool_test.rb` (6), `integration/fiber_processes_lifecycle_test.rb` (3), `unit/rake_tasks_test.rb` (2), `unit/update_generator_test.rb` (5), `unit/puma_plugin_test.rb` (3).
- 11 assertion-count and 11 assertion-kind mismatches (`parity:test --assertions`).

The tests that `solid-queue-v1-7-2-remaining-drift` (worker execution modes, the `scheduler_test.rb:160` dynamic task) and `solid-queue-limits-concurrency-on-conflict-discard` port count toward this list, but those stories own them.

## Acceptance criteria

- After the sibling stories land, every remaining listed test is ported at its v1.7.2 name and body, and the TS-only "extra" tests are removed or renamed onto Rails names.
- The fiber tests run on `FiberPool` once `remaining-drift` ports it. Any test Node cannot run gets an unported-register entry with a reason.
- Assertion mismatches go to 0. `parity:test --package solid-queue` shows no missing or skipped rows apart from registered ones.
