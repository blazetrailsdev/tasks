---
title: "executor-wrap-concurrent-flows-on-one-thread"
status: draft
updated: 2026-11-02
rfc: "0212-trailties-port"
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

`ExecutionWrapper.wrap` (`packages/activesupport/src/execution-wrapper.ts`, `execution_wrapper.rb:90-92`) answers `return yield if active?`, and `active?` is keyed by `IsolatedExecutionState`, so by `Thread`. Ruby runs one flow per Thread at a time. JS can start two on one Thread: `Promise.all([app.executor.wrap(a), app.executor.wrap(b)])` on the main thread. The second sees `active?` and skips the hooks, so `MonitorHook` does not exclude it and it takes no `InterlockHook` share of its own. Pool workers, Rack requests and `TimerTask` runs each own a Thread (trails#9600), so this is reached from application code only. Running such a wrap on a new `Thread` would move its thread-locals and connection lease.

## Acceptance criteria

- Two wraps started concurrently on one `Thread` exclude each other under `allow_concurrency = false`, or the repo owner rules the case out of scope.
- A wrap nested in another wrap's flow still answers `active?` and runs its block without the hooks.
