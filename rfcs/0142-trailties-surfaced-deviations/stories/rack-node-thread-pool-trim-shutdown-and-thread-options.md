---
title: "Rack::Handler::Node's thread pool ports trim/shutdown and takes min/max threads from options"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10489 put `Rack::Handler::Node` (`packages/rackup/lib/handler/node.ts`, `_ThreadPool`) on a pool shaped like `Puma::ThreadPool` (puma 8.0.2 `lib/puma/thread_pool.rb`). It ports `initialize` (`:86-142`), `spawn_thread` (`:188-258`) and `<<` (`:335-352`) only. `min` / `max` are hard-coded to 0 / 5 (`configuration.rb:157-158`). Nothing is wired to `trails server -t` / `--threads`. `trim` (`:366`), `reap` (`:378`), `auto_trim!` / `auto_reap!` (`:416-425`) and `shutdown` (`:444-500`) are not ported, and `Node.shutdown` never closes the pool's `todo`.

## Acceptance criteria

- `trim`, `shutdown` (closing `todo` and joining the processors) and `auto_trim!` are ported with Puma's names and control flow.
- `Node.shutdown` shuts the pool down.
- Min and max threads come from the server options instead of literals.
