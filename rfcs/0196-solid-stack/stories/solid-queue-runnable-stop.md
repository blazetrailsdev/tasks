---
title: "Port Runnable#stop"
status: closed
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10361
claim: "2026-11-19T15:16:34Z"
assignee: "solid-queue-adapter-extends-abstract-adapter"
blocked-by: null
closed-reason: "FALSIFIED: Runnable's includers are a closed set (Poller, Scheduler: poller.rb:5, scheduler.rb:5), so CLAUDE.md § 'A module included by an open set of classes binds super at include time' keeps Runnable#stop (runnable.rb:20-28) inlined in each includer with @inlinedFrom, as main already has it; a Runnable member reaching Base#stop via rbCallSuper is the open-set shape. Reviewed on trails#10361."
---

## Context

`Runnable#stop` (`vendor/solid_queue/v1.7.2/lib/solid_queue/processes/runnable.rb:20-28`) is `super; wake_up; @thread&.join unless supervised?`. trails' `packages/solid-queue/lib/processes/runnable.ts` has no `stop`; `Poller#stop` (`lib/processes/poller.ts:27-33`) and `Scheduler` (`lib/scheduler.ts:75`) each join `_thread` themselves.

## Acceptance criteria

- `Runnable#stop` is ported at `runnable.rb:20-28`, between `start` and `isAlive`.
- The per-class `_thread.join()` copies in Poller / Scheduler are removed where Rails inherits Runnable's.
