---
title: Port Finisher MonitorHook and InterlockHook and the executor concurrency initializer
status: done
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: [trailties, ruby-compat]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9579
claim: "2026-11-01T16:46:38Z"
assignee: "finisher-monitor-and-interlock-hooks"
blocked-by: null
closed-reason: null
---

## Context

`Application::Finisher::MonitorHook` and `InterlockHook`
(`vendor/rails/v8.0.2/railties/lib/rails/application/finisher.rb:96-118`) and the
`configure_executor_for_concurrency` initializer that registers them are unported
in `packages/trailties/src/application/finisher.ts`. `MonitorHook#run` /
`#complete` call `Monitor#enter` / `#exit`, and ruby-compat's `Monitor`
(`packages/ruby-compat/src/monitor.ts`) has only `synchronize` and `isMonOwned`.
`Dependencies.interlock.startRunning` / `doneRunning` already exist.

## Acceptance criteria

- `Monitor#enter` / `#exit` are ported in ruby-compat with an MRI citation.
- `MonitorHook`, `InterlockHook` and the initializer are ported at their Rails
  names, and `application/finisher.rb` reaches 100% in parity:api.
