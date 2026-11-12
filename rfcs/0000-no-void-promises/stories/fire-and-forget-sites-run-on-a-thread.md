---
title: "Background fire-and-forget promises run on ruby-compat Thread or are awaited"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: background-work
packages: []
deps: [no-floating-promises-repo-wide-ignore-void-false]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 2(b) applied outside constructors:
`ruby-compat/lib/concurrent/timer-task.ts:70`, `ruby-compat/lib/zlib-adapter.ts:294`,
`solid-queue/lib/processes/supervised.ts:48`, `solid-queue/lib/supervisor/signals.ts:37`,
`rackup/lib/handler/node.ts:63,77`, `trailties/lib/server/vite-plugin.ts:23`,
`rack/lib/lint.ts:767`, `actionpack/lib/action-controller/metal/live.ts:82`,
`actioncable/lib/connection/stream.ts:94`,
`actioncable/lib/subscription-adapter/postgresql.ts:195,199`,
`website/src/lib/frontiers/sw-client.ts:167,171`.
Some operands may not be promises (a stream `push`); those just drop the `void`.

## Acceptance criteria

- [ ] Where Rails runs the work on a thread, the port uses `Thread`; otherwise the promise is awaited or returned.
- [ ] Each remaining callback-boundary site (Node `http` handler, signal handler) routes a rejection to a real handler, never an empty one.
- [ ] Zero `void <promise>` remain in these files.
