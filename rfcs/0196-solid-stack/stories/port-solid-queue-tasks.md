---
title: "port-solid-queue-tasks"
status: claimed
updated: 2026-10-26
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-26T15:57:28Z"
assignee: "port-solid-queue-cli-and-pidfile"
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_queue/v1.1.3/lib/solid_queue/engine.rb:7-9` declares
`rake_tasks do load "solid_queue/tasks.rb" end`. `lib/solid_queue/tasks.rb`
(`solid_queue:install`, `solid_queue:start`) is unported, so
`packages/solid-queue/src/engine.ts` registers no `rakeTasks` block.

## Acceptance criteria

- `lib/solid_queue/tasks.rb` is ported.
- `SolidQueue::Engine` registers its `rakeTasks` block loading it, as `engine.rb:7-9` does.
