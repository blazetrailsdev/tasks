---
title: "ruby-compat: Thread reports the exception it dies of (report_on_exception)"
status: draft
updated: 2026-10-08
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

Surfaced by trails#8686, which ported `ConnectionPool::Reaper.spawn_thread` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/reaper.rb:40-66`) onto ruby-compat's `Thread`.

A Ruby thread that dies of an exception prints `#<Thread:...> terminated with exception (report_on_exception is true):` and the backtrace to stderr, because `Thread.report_on_exception` defaults to true (`vendor/ruby/v3.3.11/thread.c:704-706`, `:3078`). `packages/ruby-compat/src/thread.ts` has no such report: its constructor attaches a rejection handler that only marks the thread dead, and re-raises only under `abortOnException`.

So a reaper thread whose `pool.reap` raises now dies silently. Before #8686 the timer-based reaper logged it with `console.warn`; that log was removed because Rails' body has no rescue and the report is Ruby core's job.

## Acceptance criteria

- [ ] `Thread` carries `reportOnException` (class default true, per-thread override), and a thread that dies of an exception writes Ruby's "terminated with exception" report through ruby-compat's `warn`.
- [ ] A reaper thread killed by a `reap` error is reported, covered in `packages/activerecord/src/reaper.trails.test.ts`.
- [ ] Existing `Thread` callers whose blocks reject on purpose (tests) set `reportOnException = false` where Ruby's would.
