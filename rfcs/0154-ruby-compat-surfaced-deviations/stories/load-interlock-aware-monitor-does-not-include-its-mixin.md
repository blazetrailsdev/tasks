---
title: "LoadInterlockAwareMonitor does not include LoadInterlockAwareMonitorMixin"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Concurrency::LoadInterlockAwareMonitor`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/concurrency/load_interlock_aware_monitor.rb:32-34`)
is `Monitor` with `include LoadInterlockAwareMonitorMixin`, so its `synchronize` is the mixin's
`mon_enter` / block / `mon_exit` (`:18-28`) and its `mon_enter` is `mon_try_enter || super`
(`:13-16`).

trails' `LoadInterlockAwareMonitor`
(`packages/activesupport/src/concurrency/load-interlock-aware-monitor.ts`) is still
`class LoadInterlockAwareMonitor extends Monitor {}` and does not include the mixin, because
ruby-compat's `Monitor` (`packages/ruby-compat/src/monitor.ts`) has `synchronize` and
`isMonOwned` only: there is no `mon_enter` / `mon_try_enter` / `mon_exit`
(`vendor/ruby/v3.3.11/ext/monitor/monitor.c:60,76,99`) for the mixin to call. The mixin itself is ported
and prepended onto `ThreadLoadInterlockAwareMonitor` in the same file.

## Acceptance criteria

- [ ] ruby-compat's `Monitor` ports `mon_enter`, `mon_try_enter` and `mon_exit`, keeping the
      sibling-promise serialization CLAUDE.md § "The adapter lock defaults to a monitor" records.
- [ ] `LoadInterlockAwareMonitor` includes `LoadInterlockAwareMonitorMixin`, as Rails does.
- [ ] If `mon_enter` with no block cannot hold that serialization, `pnpm tasks block` with the
      specific finding.
