---
title: "port-solid-queue-log-subscriber"
status: ready
updated: 2026-10-26
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

`vendor/solid_queue/v1.1.3/lib/solid_queue/engine.rb:27-33`'s `solid_queue.logger`
initializer ends with `SolidQueue::LogSubscriber.attach_to :solid_queue`.
`lib/solid_queue/log_subscriber.rb` is unported (0/26 in `parity:api`), so
`packages/solid-queue/src/engine.ts`'s `solid_queue.logger` initializer omits that call.

## Acceptance criteria

- `SolidQueue::LogSubscriber` is ported at `packages/solid-queue/src/log-subscriber.ts`.
- The `solid_queue.logger` initializer calls `LogSubscriber.attachTo("solid_queue")` as `engine.rb:32` does.
