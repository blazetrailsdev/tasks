---
title: "Type SolidQueue.supervisorPidfile as string | null"
status: ready
updated: 2026-11-21
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-queue/lib/solid-queue.ts:128` declares `supervisorPidfile: unknown` on the `SolidQueue` mattr interface. Rails' value is a String path or nil: `mattr_accessor :supervisor_pidfile` (`vendor/solid_queue/v1.7.2/lib/solid_queue.rb`), set to `Rails.root.join("tmp/pids/solid_queue_supervisor.pid")` by the engine. Because the type is `unknown`, every reader has to cast. `packages/solid-queue/test/test-helper.ts`'s teardown, which ports `test_helper.rb:76-78`, carries `SolidQueue.supervisorPidfile as string | null` (trails#10456).

## Acceptance criteria

- `supervisorPidfile` is typed `string | null` on the `SolidQueue` interface.
- The `as string | null` cast in `test/test-helper.ts` is removed, and the `if` reads `SolidQueue.supervisorPidfile` directly, as `test_helper.rb:76` does.
