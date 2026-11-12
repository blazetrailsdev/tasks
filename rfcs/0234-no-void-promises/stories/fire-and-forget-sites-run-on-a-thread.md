---
title: "Background fire-and-forget promises run on ruby-compat Thread or are awaited"
status: draft
updated: 2026-11-12
rfc: "0234-no-void-promises"
cluster: background-work
packages: [ruby-compat, solid-queue, rackup, trailties, rack, actioncable, activestorage, website]
deps: [no-floating-promises-repo-wide-ignore-void-false, no-swallowed-rejection-lint-rule]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 2(b), applied outside constructors.
`ruby-compat/lib/concurrent/timer-task.ts:70,116`,
`ruby-compat/lib/thread-pool-executor.ts:193`,
`ruby-compat/lib/zlib-adapter.ts:294`,
`ruby-compat/lib/logger/log-device.ts:77,92`,
`solid-queue/lib/processes/supervised.ts:48`,
`solid-queue/lib/supervisor/signals.ts:37`,
`rackup/lib/handler/node.ts:63,77`, `trailties/lib/server/vite-plugin.ts:23`,
`rack/lib/lint.ts:767`, `rack/lib/deflater.ts:154`,
`actioncable/lib/connection/stream.ts:94`,
`actioncable/lib/connection/stream-event-loop.ts:49,84`,
`actioncable/lib/subscription-adapter/postgresql.ts:195,199`,
`activestorage/lib/service/mirror-service.ts:125`,
`website/src/lib/frontiers/sw-client.ts:167,171`.

## Acceptance criteria

- [ ] Where Rails runs the work on a thread, the port uses `Thread`; otherwise the promise is awaited, returned, or `Promise.allSettled`-awaited.
- [ ] A callback boundary that cannot be awaited (Node `http` request handler, signal handler) routes a rejection to a real handler that logs or re-raises.
- [ ] Zero voided or empty-caught promises remain in these files.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
