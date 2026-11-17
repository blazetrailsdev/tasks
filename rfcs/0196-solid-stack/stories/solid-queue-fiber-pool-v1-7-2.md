---
title: "Port SolidQueue::FiberPool and the fiber worker execution mode (v1.7.2)"
status: ready
updated: 2026-11-17
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Port SolidQueue::FiberPool and the fiber worker execution mode (v1.7.2)

## Context

`vendor/solid_queue/v1.7.2/lib/solid_queue/fiber_pool.rb` (18 methods in `pnpm parity:api --package solid-queue`, 0 ported) is the second `Pool` subclass. `Pool.build(type: :fiber)` (`pool.rb:7-13`, ported in `packages/solid-queue/lib/pool.ts`) resolves `SolidQueue::FiberPool` through `const_get`, and `Worker#initialize` (`packages/solid-queue/lib/worker.ts`) already picks `"fiber"` when `fibers:` is passed, so a fiber worker raises `NameError` today.

Upstream runs one reactor thread with the `async` gem: `Async { |task| Async::Semaphore.new(size, parent: task) ... }`, feeding it from a `Thread::Queue` that the poller pushes to and `shutdown` closes (`fiber_pool.rb:59-110`). Fatal reactor errors are recorded once (`register_fatal_error`) and re-raised by `post` / `available_capacity` (`raise_if_fatal_error!`).

There is no `async` gem port. The JS event loop already is a fiber scheduler, so the likely shape is a `FiberPool` over ruby-compat `Thread` + a counting semaphore + a ruby-compat `Queue`, keeping every Rails method name (`start_reactor_if_needed`, `start_reactor`, `wait_for_executions`, `register_fatal_error`, `raise_if_fatal_error!`, `shutdown`, `shutdown?`, `wait_for_termination`). How `Async::Stop` and `Async::Semaphore` are represented needs an operator decision before code; record it in the package `CLAUDE.md`.

Also unported and owned here:

- `configuration.rb:131-153` `ensure_fiber_workers_are_supported` / `ensure_fiber_workers_use_supported_isolation_level` (the `require "async"` check has no npm analogue; the isolation-level check maps to `IsolatedExecutionState.isolationLevel`).
- Tests: `test/unit/fiber_pool_test.rb` (6), `test/integration/fiber_processes_lifecycle_test.rb` (3), and the `fiber`-mode half of `test/unit/worker_test.rb`'s `EXECUTION_MODES` loop ("worker is registered as process in fiber mode", "claim and process more enqueued jobs than the pool size allows to process at once in fiber mode"); the `thread`-mode halves are ported.
- `configuration_test.rb` "fibers configure workers to execute jobs in fibers", "workers reject threads and fibers together", and the two "fiber worker size … database pool size" tests.

## Acceptance criteria

- `FiberPool` exists at `packages/solid-queue/lib/fiber-pool.ts`, seated as `SolidQueue.FiberPool`, every method at its Rails name; `Pool.build({ type: "fiber" })` returns one.
- The fiber tests above are ported under their v1.7.2 names (the worker ones as the `EXECUTION_MODES` loop) and pass on SQLite, PostgreSQL and MariaDB.
- `pnpm parity:api --package solid-queue` shows `fiber_pool.rb` at 100%.
