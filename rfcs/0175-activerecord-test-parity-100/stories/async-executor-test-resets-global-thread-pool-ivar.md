---
title: "async-executor-test-resets-global-thread-pool-ivar"
status: draft
updated: 2026-10-08
rfc: "0175-activerecord-test-parity-100"
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

`AsynchronousExecutorTypeTest#test_concurrency_can_be_set_on_global_thread_pool` (`vendor/rails/v8.0.2/activerecord/test/cases/asynchronous_queries_test.rb:185-223`) clears the memoized global executor before changing the concurrency:

```ruby
old_global_thread_pool_async_query_executor = ActiveRecord.instance_variable_get(:@global_thread_pool_async_query_executor)
ActiveRecord.instance_variable_set(:@global_thread_pool_async_query_executor, nil)
ActiveRecord.global_executor_concurrency = 8
```

In trails the memo is a module-level `let _globalThreadPoolAsyncQueryExecutor` in `packages/activerecord/src/active-record.ts:31`, read only by `globalThreadPoolAsyncQueryExecutor()` (`:190-198`). Nothing outside the module can reset it, so the test is an `it.skip` in `packages/activerecord/src/asynchronous-queries.test.ts`. Every other test in that file is enrolled, and `ThreadPoolExecutor` already exposes `minLength` / `maxLength` / `maxQueue` / `fallbackPolicy`, which the body asserts.

Rails' `ActiveRecord` module ivars (`active_record.rb:286-294` for this one) are plain `let`s throughout `active-record.ts`, so this is the general question of how a test reaches `ActiveRecord.instance_variable_set`.

## Acceptance criteria

- [ ] `@global_thread_pool_async_query_executor` is reachable the way the Rails test reaches it, without a setter Rails does not have.
- [ ] `concurrency can be set on global thread pool` is enrolled with Rails' body and passes.
