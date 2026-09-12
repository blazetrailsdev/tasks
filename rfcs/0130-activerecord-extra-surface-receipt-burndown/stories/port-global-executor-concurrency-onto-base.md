---
title: "Port ActiveRecord.global_executor_concurrency onto Base with its ArgumentError guard"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails defines two `:nodoc:` singleton members next to `async_query_executor`:

    # vendor/rails/activerecord/lib/active_record.rb:298-308
    def self.global_executor_concurrency=(global_executor_concurrency)
      if self.async_query_executor.nil? || self.async_query_executor == :multi_thread_pool
        raise ArgumentError, "`global_executor_concurrency` cannot be set when the executor is nil or set to `:multi_thread_pool`. For multiple thread pools, please set the concurrency in your database configuration."
      end

      @global_executor_concurrency = global_executor_concurrency
    end

    def self.global_executor_concurrency # :nodoc:
      @global_executor_concurrency ||= nil
    end

and reads the value in `global_thread_pool_async_query_executor` (`:286-296`):
`concurrency = global_executor_concurrency || 4`, feeding `Concurrent::ThreadPoolExecutor.new`.

PR #7723 moved the `ActiveRecord` singleton config seats onto `Base` but did NOT port this pair.
Reason: trails' `AsyncExecutor` (`packages/activerecord/src/ar-config.ts`) is a single-thread
`queueMicrotask` wrapper with no pool to size, so the value would have no effect, and the
extra-surface gate scores both names as novel — Rails marks them `:nodoc:`, so the api manifest
records no definition for them (only the call from `connection_pool.rb`). The executor's missing
constructor arguments are receipted at the call site with
`@missingRailsArgs new — PERMANENT` in `packages/activerecord/src/base.ts`.

The receipt covers the ARGUMENTS. It does not cover the two missing public members: a trails user
writing `ActiveRecord.global_executor_concurrency = 8` has no counterpart to call, and the
`ArgumentError` guard Rails raises for an unset or `:multi_thread_pool` executor is unported.

## Converged shape

Port both members onto `Base` beside `asyncQueryExecutor`, in Rails order, with the setter's guard
and message verbatim from `:299-303`. Decide and record how they score:

- if the api manifest still yields no counterpart for a `:nodoc:` module method, the pair needs a
  receipt pointing at this story rather than being left unported, and
- `globalThreadPoolAsyncQueryExecutor` then reads `Base.globalExecutorConcurrency ?? 4` even though
  the value cannot size a JS microtask queue — the read is what makes the setter observable.

An alternative worth pricing first: teach the extractor to record `:nodoc:` singleton methods in
`active_record.rb`, which would also retire the novel-surface pressure that blocked this in #7723.

## Acceptance criteria

- [ ] `globalExecutorConcurrency` reader and writer exist on `Base` with Rails' guard and message.
- [ ] `globalThreadPoolAsyncQueryExecutor` reads the value as `|| 4` does.
- [ ] `pnpm parity:api:extra:gate` stays green (novel 0), by receipt or by extractor fix.
