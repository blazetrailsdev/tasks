---
title: "SolidQueue delegates on_exit to Supervisor"
status: done
updated: 2026-11-18
rfc: "0196-solid-stack"
cluster: null
packages: []
deps:
  - solid-queue-v1-7-2-remaining-drift
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10256
claim: "2026-11-18T21:37:12Z"
assignee: "around-callback-conditions-await-thenables"
blocked-by: null
closed-reason: null
---

# SolidQueue delegates on_exit to Supervisor

## Context

`vendor/solid_queue/v1.7.2/lib/solid_queue.rb:57` is `delegate :on_start, :on_stop, :on_exit, to: Supervisor`. `packages/solid-queue/lib/solid-queue.ts` ports it as `delegate.call(SolidQueue, "onStart", "onStop", { to: "Supervisor" })` and leaves out `onExit`. The reason is that `LifecycleHooks#on_exit` (`vendor/solid_queue/v1.7.2/lib/solid_queue/lifecycle_hooks.rb:20-22`, plus the `exit:` key in its `lifecycle_hooks` default, `:8`) is not ported in `packages/solid-queue/lib/lifecycle-hooks.ts`. Porting it belongs to `solid-queue-v1-7-2-remaining-drift`.

trails#10267 taught the extractor to credit this `delegate.call`, so `on_start` and `on_stop` now match on `solid_queue.rb` in `pnpm parity:api --package solid-queue`. `on_exit` is still listed as missing.

## Acceptance criteria

- The `delegate.call` in `solid-queue.ts` lists `"onStart", "onStop", "onExit"`, as Rails does.
- `SolidQueue.onExit(block)` registers an exit hook on `Supervisor`.
- `pnpm parity:api --package solid-queue` shows `on_exit` matched on `solid_queue.rb`.
