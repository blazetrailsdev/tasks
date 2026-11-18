---
title: "processes-lifecycle.test.ts assertRegisteredWorkersFor takes *queues, supervisor_pid:"
status: draft
updated: 2026-11-18
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-queue/test/integration/processes-lifecycle.test.ts:81` declares `assertRegisteredWorkersFor(queues: string[], supervisorPid: number | null = null)`, an array plus a positional pid. Rails' helper is `def assert_registered_workers_for(*queues, supervisor_pid: nil)` (`vendor/solid_queue/v1.7.2/test/integration/processes_lifecycle_test.rb`, the private helper section; the fiber twin is at `fiber_processes_lifecycle_test.rb:93`). trails#10280 converged the fiber twin to `(...args: [...queues: string[], options: { supervisorPid?: number | null }])`.

## Acceptance criteria

- `assertRegisteredWorkersFor` in `processes-lifecycle.test.ts` takes the queues as a rest parameter and `{ supervisorPid }` as a trailing options object, matching the fiber test's shape.
- Every call site passes `"background", "default", { supervisorPid: RbProcess.pid }` style arguments.
