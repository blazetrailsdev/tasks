---
title: "port-solid-queue-engine"
status: ready
updated: 2026-10-23
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

## Context

`vendor/solid_queue/v1.1.3/lib/solid_queue/engine.rb:41-47` includes
`Processes::Interruptible` into `Processes::Base` from the
`solid_queue.include_interruptible_concern` initializer (the Ruby >= 3.2 arm;
`OgInterruptible` otherwise), and `:19-25` seats `SolidQueue.app_executor` /
`on_thread_error` from the app. trails has no `SolidQueue::Engine` yet, so
trails#9273 includes `Interruptible` statically in
`packages/solid-queue/src/processes/base.ts`.

## Acceptance criteria

- `SolidQueue::Engine` is ported at `packages/solid-queue/src/engine.ts`, with
  its initializers in Rails order.
- The `Interruptible` include moves from `processes/base.ts` into the
  `include_interruptible_concern` initializer, and the `app_executor` /
  `on_thread_error` defaults are seated as at `engine.rb:19-25`.
