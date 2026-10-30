---
title: "Await SolidQueue::Record.connectsTo instead of floating it in an onLoad hook"
status: done
updated: 2026-10-30
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9477
claim: "2026-10-30T01:58:51Z"
assignee: "solid-queue-record-connects-to-awaited"
blocked-by: null
closed-reason: null
---

## Context

`SolidQueue::Record` runs `connects_to(**SolidQueue.connects_to) if SolidQueue.connects_to` in its class body (`vendor/solid_queue/v1.1.3/app/models/solid_queue/record.rb:7`). trails runs it from a `runOnce` `onLoad("solid_queue_record")` hook registered in the `solid_queue.config` initializer (`packages/solid-queue/src/engine.ts:36-45`). `connectsTo` is async (`packages/activerecord/src/connection-handling.ts:25`), and `ActiveSupport` load hooks are synchronous (`packages/activesupport/src/lazy-load-hooks.ts:59-67`). So the promise floats: a failure is an unhandled rejection, and `Record` can be used before its pools are registered.

trails#9459 converged solid-cable's twin by awaiting `Record.connectsTo(connectsTo)` directly in the `solid_cable.config` initializer after the config is loaded (`packages/solid-cable/src/engine.ts`).

## Acceptance criteria

- The `solid_queue.config` initializer awaits `Record.connectsTo(SolidQueue.connectsTo)` when it is present, with no floating promise.
- `packages/solid-queue/CLAUDE.md` § "`Record`'s class body runs in a `solid_queue_record` load hook" is updated to match. That section is an owner ruling, so it needs owner sign-off.
- An engine test asserts the call when `connectsTo` is set and its absence when it is not.
