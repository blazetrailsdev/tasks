---
title: "Port Runnable#alive?"
status: in-progress
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10333
claim: "2026-11-19T01:26:11Z"
assignee: "solid-queue-active-job-accessors-attr-accessor"
blocked-by: null
closed-reason: null
---

## Context

`Runnable#alive?` (`vendor/solid_queue/v1.7.2/lib/solid_queue/processes/runnable.rb:30-32`) is `!running_async? || @thread&.alive?`. `packages/solid-queue/lib/processes/runnable.ts` (trails#10323 added `run_in_mode` / boot guards) does not port it; `parity:api --missing` lists `alive? → isAlive` on `processes/runnable.rb`. The supervisor reads `instance._thread.isAlive()` directly (`packages/solid-queue/lib/supervisor.ts`).

## Acceptance criteria

- `Runnable#isAlive()` ports `alive?` at its Rails shape.
- Callers that read `_thread.isAlive()` on a supervisee use `isAlive()` where Rails calls `alive?`.
