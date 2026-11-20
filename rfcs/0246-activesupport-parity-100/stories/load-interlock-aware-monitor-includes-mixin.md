---
title: "load-interlock-aware-monitor-includes-mixin"
status: ready
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
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

`vendor/rails/v8.0.2/activesupport/lib/active_support/concurrency/load_interlock_aware_monitor.rb:32-34`
is `class LoadInterlockAwareMonitor < Monitor; include LoadInterlockAwareMonitorMixin`.
`packages/activesupport/lib/concurrency/load-interlock-aware-monitor.ts:40` is
`export class LoadInterlockAwareMonitor extends Monitor {}` with no mixin, because
ruby-compat's `Monitor` (`packages/ruby-compat/lib/monitor.ts:194`) has no
`mon_try_enter` / `mon_enter` / `mon_exit` for `LoadInterlockAwareMonitorMixin#mon_enter`
to call (`vendor/ruby/v3.3.11/ext/monitor/lib/monitor.rb`).

`packages/activesupport/test/concurrency/load-interlock-aware-monitor.test.ts` parks
`LoadInterlockAwareMonitorTest`'s two tests (`load_interlock_aware_monitor_test.rb:10-48`)
as `BLOCKED: load-interlock-aware-monitor-includes-mixin`.

## Acceptance criteria

- [ ] ruby-compat `Monitor` answers `monTryEnter`, `monEnter`, `monExit` (MRI `monitor.rb` names).
- [ ] `LoadInterlockAwareMonitor` includes `LoadInterlockAwareMonitorMixin` as Rails does.
- [ ] Both `LoadInterlockAwareMonitorTest` tests run and pass.
