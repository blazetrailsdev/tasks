---
title: "load_interlock_aware_monitor_test.rb's parked reason no longer holds"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
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

`scripts/parity/unported-files/activesupport.ts` parks
`concurrency/load_interlock_aware_monitor_test.rb` ("entering with no blocking", "entering with
blocking", "lock owned by thread") with the reason "JS is single-threaded and has no monitor to
contend for".

PR #8360 ported `ThreadLoadInterlockAwareMonitor` and `LoadInterlockAwareMonitorMixin`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/concurrency/load_interlock_aware_monitor.rb:7-68`)
with `Thread`-owned exclusion, and ruby-compat has `Thread`, so that reason no longer holds for the
whole file. `vendor/rails/v8.0.2/activesupport/test/concurrency/load_interlock_aware_monitor_test.rb`
still leans on `ActiveSupport::Dependencies.interlock`, which is scoped out
(`scripts/parity/conventions.ts`, `dependencies/interlock.rb`).

## Acceptance criteria

- [ ] Each of the three cases is read against the Rails test and either ported (a case that only
      needs a second `Thread` contending for the monitor) or kept parked with a reason naming the
      `Dependencies.interlock` call it depends on.
- [ ] The unported-files row and its baseline row are narrowed or deleted to match.
