---
title: "ruby-compat-kernel-at-exit"
status: draft
updated: 2026-10-26
rfc: "0154-ruby-compat-surfaced-deviations"
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

`SolidQueue::Supervisor::Pidfile#set_at_exit_hook`
(`vendor/solid_queue/v1.1.3/lib/solid_queue/supervisor/pidfile.rb:49-51`) is
`at_exit { delete if ::Process.pid == pid }`. ruby-compat has no `Kernel#at_exit`
(`rb_f_at_exit`, `vendor/ruby/v3.3.11/eval_jump.c`) and the `ProcessAdapter`
(`packages/ruby-compat/src/process-adapter.ts`) has no exit hook, so
`packages/solid-queue/src/supervisor/pidfile.ts`'s `setAtExitHook` is empty and
carries `@missingRailsCall at_exit — CONVERGEABLE ruby-compat-kernel-at-exit`.
Node's `exit` event runs synchronously only, so an async block (Pidfile's
`delete` is async fs) needs a decided shape.

## Acceptance criteria

- ruby-compat ports `Kernel#at_exit` (LIFO, as MRI runs them) over a process-adapter hook.
- `Pidfile#setAtExitHook` registers `delete if Process.pid == pid` and its receipt is removed.
