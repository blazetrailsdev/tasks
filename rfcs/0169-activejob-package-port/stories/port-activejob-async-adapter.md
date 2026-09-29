---
title: "Port QueueAdapters::AsyncAdapter over ruby-compat's executors, with async_adapter_test.rb and the AJ_ADAPTER=async lane"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-enqueuing-and-configured-job",
    "port-ruby-compat-concurrent-immediate-executor-and-scheduled-task",
    "port-activejob-test-fixture-jobs",
  ]
deps-rfc: []
est-loc: 300
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapters/async_adapter.rb` (116 lines): `initialize(**executor_options)`,
`enqueue`, `enqueue_at`, `shutdown(wait: true)`, `immediate=` (`:35-58`);
`JobWrapper` (`:63-72`; sets `provider_job_id = SecureRandom.uuid`, stores
`job.serialize`, `perform` → `Base.execute`); `Scheduler` (`:74-114`) with
`DEFAULT_EXECUTOR_OPTIONS` (`:75-82`), `enqueue`, `enqueue_at`, `shutdown`,
`executor`.

RFC 0147's Non-goals hand this spawn site to "whoever ports
`async_adapter.rb`"; ruby-compat's `ThreadPoolExecutor` already gives each
task its own execution context. `Base.queue_adapter`'s `:async` default
(`queue_adapter.rb:35`) starts resolving once this lands.

**CI lane.** Add the `AJ_ADAPTER=async` invocation; its setup file ports
`vendor/rails/v8.0.2/activejob/test/adapters/async.rb` (`queue_adapter = :async`, `immediate = true`).
`async_adapter_test.rb` runs only in this lane (`vendor/rails/v8.0.2/activejob/Rakefile:38-41`).

`vendor/rails/v8.0.2/activejob/test/cases/async_adapter_test.rb`: 2 cases, as `parity:test` names them:

- [ ] `:13` AsyncAdapterTest — "in immediate run, perform_later runs immediately"
- [ ] `:18` AsyncAdapterTest — "in immediate run, enqueue with wait: runs immediately"

## Fidelity traps (predicted at authoring)

- [ ] **`ENV.fetch("RAILS_MAX_THREADS", 5).to_i`** (`:77`) is a stored-value `fetch`: an empty string set in the environment is used (and `to_i`s to `0`), not replaced by 5.
- [ ] **`delay = timestamp - Time.current.to_f`; `if !immediate && delay > 0`** (`:97-98`): immediate mode, or a past timestamp, enqueues now.
- [ ] **`fallback_policy: :caller_runs`** is a Symbol option → `":caller_runs"` where ruby-compat takes it.
- [ ] **`shutdown(wait: true)`** awaits termination only when `wait`.

## Acceptance criteria

- [ ] `async_adapter.rb` reads complete in `parity:api`.
- [ ] CI runs the `async` lane and it is green.
- [ ] Two concurrent jobs on the non-immediate executor see separate execution contexts.

## Definition of done

Registering the lane without its setup file, or wrapping tasks in a second execution-context mint, does not close this story.
