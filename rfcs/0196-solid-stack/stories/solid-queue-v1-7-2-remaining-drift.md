---
title: "solid-queue-v1-7-2-remaining-drift"
status: in-progress
updated: 2026-11-17
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10256
claim: "2026-11-17T15:34:27Z"
assignee: "solid-queue-v1-7-2-remaining-drift"
blocked-by: null
closed-reason: null
---

# Converge the rest of solid_queue v1.7.2 drift left by the bump

## Context

The PR for solid-queue-recurring-schedule-v1-7-2 bumped `vendor/solid_queue` to v1.7.2 and converged the recurring schedule, Scheduler dynamic tasks, Registrable, Pool/ThreadPool, BlockedExecution#release and every call-gate row. Upstream changes no gate reports are still unported:

- `app/models/solid_queue/recurring_task.rb`: `create_dynamic_task`, `delete_dynamic_task`, `parsed_schedule_with_time_zone` / `apply_default_time_zone_to` / `default_time_zone` (`SolidQueue.time_zone`), `report_enqueue_error`; the extra `active_job.successfully_enqueued = true` in `enqueue_and_record` (removed upstream, now set by `Job.enqueue`, `job.rb:45-50`).
- `lib/solid_queue.rb`: `schedule_recurring_task` / `unschedule_recurring_task`, which unblocks `scheduler_test.rb:160` "reschedules a dynamic task recreated with the same key".
- `lib/solid_queue/fiber_pool.rb` — split out to `solid-queue-fiber-pool-v1-7-2`, which also owns the fiber execution-mode tests.
- `app/models/solid_queue/claimed_execution.rb`: `FinalizationError`, `finalizing`, `finalize`, `unless_already_finalized`, `still_claimed?`, and `fail_all_with`'s early return.
- `app/models/solid_queue/job/concurrency_controls.rb:29-110`: concurrency-lock recording (`CONCURRENCY_LOCK_KEY`, `record_concurrency_lock`, `holds_concurrency_slot?`).
- `lib/solid_queue/lifecycle_hooks.rb` exit hooks (`after_shutdown :run_exit_hooks` in scheduler.rb and worker.rb).
- `lib/solid_queue/configuration.rb:156-167` `default_options`' `mode` / `standalone` keys.
- `app/models/solid_queue/job/retryable.rb:18-29` `failed_with`'s nested-transaction `create!` / `RecordNotUnique` update, and `failed_execution.rb`'s `before_save :expand_error_details_from_exception, if: :exception` and `retry_all`'s counter reset.
- `app/models/solid_queue/process.rb:22-32` `heartbeat` restoring attributes on failure; `job.rb:25-28` `enqueue_all` defaulting `scheduled_at`; `lib/solid_queue/engine.rb:19-23` the `solid_queue.time_zone` initializer.
- `test/unit/worker_test.rb` execution modes and the renamed tests (thread mode; fiber mode is in `solid-queue-fiber-pool-v1-7-2`).

## Acceptance criteria

- Each item above is ported at its Rails name and shape, with its v1.7.2 tests where they exist.
- No new call-mismatch or call-args baseline rows.
