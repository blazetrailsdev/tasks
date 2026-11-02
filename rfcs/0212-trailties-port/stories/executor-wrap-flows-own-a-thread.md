---
title: "executor-wrap-flows-own-a-thread"
status: done
updated: 2026-11-02
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9600
claim: "2026-11-02T00:07:14Z"
assignee: "executor-wrap-flows-own-a-thread"
blocked-by: null
closed-reason: null
---

## Context

`Monitor#enter` (`packages/ruby-compat/src/monitor.ts`) owns its entry by `Thread` where MRI owns it by fiber (`vendor/ruby/v3.3.11/ext/monitor/monitor.c:76-85`). `enter` takes no block, and `AsyncContext` offers only `run(store, fn)`, so a flow-scoped owner has no seat. Rack requests each get a `Thread` (`packages/rack/src/handler/node.ts`), but an `executor.wrap` outside a request on one Thread (action-cable, active-job, solid-queue) re-enters a `MonitorHook` monitor (`vendor/rails/v8.0.2/railties/lib/rails/application/finisher.rb:123-125`) and shares `InterlockHook`'s Thread-keyed `ShareLock` shares.

## Acceptance criteria

- Concurrent `executor.wrap` flows outside a request exclude each other under `allow_concurrency = false`, each running on its own `Thread` or owner.
- The same flows block a reload through `InterlockHook`, as `dependencies/interlock.rb:21-31` does.
