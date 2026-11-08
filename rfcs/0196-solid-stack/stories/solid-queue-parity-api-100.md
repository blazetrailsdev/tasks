---
title: "solid-queue parity:api reaches 100% (dynamic methods, og_interruptible, arity)"
status: claimed
updated: 2026-11-08
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 250
priority: 2
pr: null
claim: "2026-11-08T13:45:22Z"
assignee: "solid-queue-parity-api-100"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package solid-queue --missing` on origin/main (45db00824f) reports 667/703 methods (94.9%), files 55/56, inheritance 33/34, arity 272/274. Most misses are methods trails defines dynamically, so the extractor does not see them:

- `processes/callbacks.rb` 0/6: `before_boot`..`after_shutdown` come from `defineModelCallbacks("boot", "shutdown")` in `packages/solid-queue/src/processes/callbacks.ts`.
- `solid_queue.rb` 59/68: `on_start`/`on_stop`/`on_{worker,dispatcher,scheduler}_{start,stop}`, `instrument`.
- `configuration.rb` 24/29: `Process` Struct accessors `kind`, `kind=`, `attributes`, `attributes=`, `instantiate`.
- `supervisor` attr on `processes/{poller,runnable,supervised}.rb` and `scheduler.rb`; `process`/`process=` declaration-only on `processes/base.rb`.
- `job/executable.rb` `finished`, `job/retryable.rb` `failed`, `job/schedulable.rb` `scheduled`.
- `engine.rb` 6/8: `self_pipe`, `create_self_pipe`.
- `processes/og_interruptible.rb` 0/5, file missing. Upstream keeps it as the Ruby <= 3.1 fallback.
- Arity (advisory): `ReadyExecution.queued_as` and `ScheduledExecution.next_batch` scopes take an argument in TS where the extractor reads `()`.

## Acceptance criteria

- `pnpm parity:api --package solid-queue` reports 100% methods, files and inheritance. Each miss gets a real method at its Rails name, or the file goes in the unported register with a reason (og_interruptible). No catch-all excludes.
- Arity mismatches are fixed, or recorded with a reason where they are extractor artifacts of `scope` lambdas.
