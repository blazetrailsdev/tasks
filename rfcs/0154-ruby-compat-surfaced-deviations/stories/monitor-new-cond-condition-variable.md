---
title: "MonitorMixin#new_cond: a ConditionVariable for ShareLock"
status: draft
updated: 2026-10-15
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Concurrency::ShareLock`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/concurrency/share_lock.rb`)
includes `MonitorMixin` and builds `@cv = new_cond` (`:51`). Its `wait_for`
(`:217-222`) calls `@cv.wait_while(&block)` and every unlock calls
`@cv.broadcast`. ruby-compat's `Monitor` / `synchronize`
(`packages/ruby-compat/src/monitor.ts`) has no `new_cond`, so `ShareLock`, and
with it `ActiveSupport::Dependencies::Interlock`, cannot be ported. That blocks
`debug-locks-reads-dependencies-interlock` (which reads
`Dependencies.interlock.raw_state`, `action_dispatch/middleware/debug_locks.rb:50`).

## Acceptance criteria

- `MonitorMixin#new_cond` (`vendor/ruby/v3.3.11/ext/monitor/lib/monitor.rb`)
  returns a `MonitorMixin::ConditionVariable` with `wait`, `wait_while`,
  `wait_until`, `signal` and `broadcast`. `wait` releases the monitor held by
  the current async owner and reacquires it before returning, as Ruby's does.
- It is ported against the async-owner model `synchronize` already uses, and
  has tests mirroring Ruby's monitor condition-variable semantics.
