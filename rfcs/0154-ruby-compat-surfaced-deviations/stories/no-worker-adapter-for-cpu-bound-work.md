---
title: "ruby-compat has no worker adapter, so synchronous CPU work blocks every request"
status: draft
updated: 2026-10-27
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found building trailmap#82 (`/sessions/pane`). `renderPaneLog` (trailmap `lib/ringo-core.ts`) runs ringo's terminal replay as a WASI command. `_start` is synchronous, at roughly 110–170 ms per MiB of log, and the largest log in the archive takes 8.8 s, all of it on the event loop.

`@blazetrails/ruby-compat` has runtime-neutral adapters for fs, http and child processes (`getFs`, `getHttpAsync`, `getChildProcessAsync`), but none for a worker. Application code may not import `node:worker_threads`, so trailmap could not move the replay off-thread. It bounds the input to the last 2 MiB instead, which holds the event loop for 0.3–0.4 s, while ringo replays the last 32 MiB.

Expected shape: `getWorkerAsync()` returns an adapter that runs a module's exported function in a worker, with structured-clone arguments and transferable `Uint8Array`s. It would sit on worker_threads in Node and on Web Workers elsewhere.

## Acceptance criteria

- A ruby-compat worker adapter runs a module function off the main thread and resolves with its result.
- A `Uint8Array` argument can be transferred rather than copied.
- A test proves the event loop stays responsive (a timer fires) while a CPU-bound worker call runs.
