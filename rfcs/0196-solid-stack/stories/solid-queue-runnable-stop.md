---
title: "Port Runnable#stop"
status: ready
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Runnable#stop` (`vendor/solid_queue/v1.7.2/lib/solid_queue/processes/runnable.rb:20-28`) is `super; wake_up; @thread&.join unless supervised?`. trails' `packages/solid-queue/lib/processes/runnable.ts` has no `stop`; `Poller#stop` (`lib/processes/poller.ts:27-33`) and `Scheduler` (`lib/scheduler.ts:75`) each join `_thread` themselves.

## Acceptance criteria

- `Runnable#stop` is ported at `runnable.rb:20-28`, between `start` and `isAlive`.
- The per-class `_thread.join()` copies in Poller / Scheduler are removed where Rails inherits Runnable's.
