---
title: "unify-ruby-compat-monitor-implementations"
status: claimed
updated: 2026-10-15
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-15T19:47:18Z"
assignee: "cookie-jar-serializer-fallbacks-and-legacy-cbc-upgrade"
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/monitor.ts` carries two monitors. `synchronize` /
`isMonOwned` own by an async-context Symbol and serialize sibling promises
under one holder; `ConnectionPool` relies on that (packages/activerecord/CLAUDE.md,
"The pool monitor guards only sections that span an `await`"). `monEnter` /
`monExit` / `monSynchronize` / `MonitorConditionVariable` (trails#8943) own by
`Thread.current()` as `ext/monitor/monitor.c` does, and are what
`Concurrency::ShareLock` (`activesupport/lib/active_support/concurrency/share_lock.rb`)
needs, since its `new_cond` must give the monitor up across `wait`. Ruby has one
`MonitorMixin` (`vendor/ruby/v3.3.11/ext/monitor/lib/monitor.rb:91,256`).

## Acceptance criteria

- One monitor implementation backs `Monitor`, `synchronize` and `new_cond`.
- `ConnectionPool` and `ShareLock` keep their current tests green.
