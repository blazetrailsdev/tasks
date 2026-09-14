---
title: "global-thread-pool-executor-honors-concurrency"
status: draft
updated: 2026-09-14
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

`ActiveRecord.global_thread_pool_async_query_executor` (`vendor/rails/activerecord/lib/active_record.rb:286-294`) builds `Concurrent::ThreadPoolExecutor.new(min_threads: 0, max_threads: concurrency, max_queue: concurrency * 4, fallback_policy: :caller_runs)`. trails' `globalThreadPoolAsyncQueryExecutor` (`packages/activerecord/src/active-record.ts`) computes `concurrency`, throws it away with `void`, and builds an `AsyncExecutor` (`ar-config.ts`) that takes no options. A `@missingRailsArgs new — PERMANENT` tag hides the gap. `ConnectionPool#build_async_executor`'s multi_thread_pool arm (`connection-pool.ts:882`, Rails `connection_pool.rb` build_async_executor) has the same gap.

## Acceptance criteria

- `AsyncExecutor` accepts `minThreads` / `maxThreads` / `maxQueue` / `fallbackPolicy` and enforces them: at most `maxThreads` tasks run at once, `maxQueue` is honored, and `caller_runs` runs a task inline once the queue is full.
- Both call sites pass what Rails passes. The `@missingRailsArgs` tag is deleted.
