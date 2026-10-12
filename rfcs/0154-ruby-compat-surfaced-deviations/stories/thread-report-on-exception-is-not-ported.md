---
title: "ruby-compat: Thread does not report a dying thread's exception and has no report_on_exception"
status: draft
updated: 2026-10-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

MRI prints a dying thread's exception to stderr when `Thread.report_on_exception` is true
(`vendor/ruby/v3.3.11/thread.c:704-706`; the class-level reader and writer are documented at
`:3078-3124`). ruby-compat's `Thread` (`packages/ruby-compat/src/thread.ts`) reports nothing when
its block throws or rejects, and has no `report_on_exception` reader or writer. A field for it was
added and removed in trails#8808 because nothing read it.

One ported test depends on it: Rails'
`test_non_bang_disconnect_and_clear_reloadable_connections_throw_exception_if_threads_dont_return_their_conns`
(`vendor/rails/v8.0.2/activerecord/test/cases/connection_pool_test.rb:668-681`) sets
`Thread.report_on_exception = false` around its body and restores it in `ensure`. The trails port
in `packages/activerecord/src/connection-pool.test.ts` omits both lines.

## Acceptance criteria

- [ ] `Thread` reports a thread that dies of an exception as MRI does when the flag is true, and
      exposes `Thread.report_on_exception` as a reader and a writer (methods, not a data field),
      with `.trails.test.ts` coverage; or the repo owner rules the report permanent-unported and
      the ruling is recorded.
- [ ] If ported, the pool test above sets and restores the flag as `connection_pool_test.rb:669`
      and `:679-680` do.
