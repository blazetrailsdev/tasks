---
title: "ExecutionWrapper.wrap/perform type the promise a run hook returns"
status: done
updated: 2026-11-20
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10453
claim: "2026-11-20T21:54:35Z"
assignee: "converge-code-generator-encrypted-config-file-update-checker-calls"
blocked-by: null
closed-reason: null
---

## Context

`ExecutionWrapper.wrap` / `perform` (`packages/activesupport/lib/execution-wrapper.ts:119-188`)
are typed `<T>(block: () => T): T`. They return a promise whenever a run hook returns one:
trailties' cold-schema `to_run` re-warm, and since trails#10318 `ConnectionPool::ExecutorHooks.run`
(`packages/activerecord/lib/connection-adapters/abstract/connection-pool.ts`) when a pool needs
warming. A sync caller then gets an unowned promise, and its block runs after an await.
`packages/trailties/test/trailties/active-record.test.ts` ("runInitializers installs the executor
hooks that open an async query session") called `Executor.wrap` without awaiting it and broke.
Rails' `wrap` (`vendor/rails/v8.0.2/activesupport/lib/active_support/execution_wrapper.rb:83-99`)
is synchronous. Root CLAUDE.md § "Every promise has an owner" says a sync caller of an async
method becomes async.

## Acceptance criteria

- `wrap` / `perform` declare a return type that admits the promise (`T | Promise<Awaited<T>>`,
  or async throughout), so `no-floating-promises` sees every caller that drops it.
- Every caller in `packages/*/lib` and `packages/*/test` that drops the result is converged to
  await or return it, including actioncable's `executor.wrap` around-callbacks
  (`packages/actioncable/lib/engine.ts:130-131`).
