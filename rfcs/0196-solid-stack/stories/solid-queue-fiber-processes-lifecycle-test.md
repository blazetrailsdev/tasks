---
title: "solid-queue-fiber-processes-lifecycle-test"
status: draft
updated: 2026-11-17
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Port fiber_processes_lifecycle_test.rb (v1.7.2)

## Context

`vendor/solid_queue/v1.7.2/test/integration/fiber_processes_lifecycle_test.rb` (3 tests: "process jobs in fibers in a forked worker", "term supervisor while there are jobs in-flight", "quit supervisor while there are jobs in-flight") forks a supervisor that first sets `ActiveSupport::IsolatedExecutionState.isolation_level = :fiber`, then starts with `workers: [{ queues: :background, fibers: 3, polling_interval: 0.1 }]`.

`FiberPool` is ported (`packages/solid-queue/lib/fiber-pool.ts`, story solid-queue-fiber-pool-v1-7-2). The trails sibling is `packages/solid-queue/test/integration/processes-lifecycle.test.ts`, which boots the supervisor through `runSupervisor` in `test/support/processes-test-helper.ts`. That helper has no way to set the child's isolation level before `Supervisor.start`, so the fiber worker's configuration fails `ensureFiberWorkersUseSupportedIsolationLevel`.

## Acceptance criteria

- The child process the helper spawns can be booted with fiber isolation, as the Rails `fork` block does.
- `test/integration/fiber-processes-lifecycle.test.ts` ports the 3 tests under their v1.7.2 names and passes on SQLite, PostgreSQL and MariaDB.
