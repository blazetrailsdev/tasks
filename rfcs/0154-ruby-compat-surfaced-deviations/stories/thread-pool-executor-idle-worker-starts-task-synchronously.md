---
title: "ruby-compat ThreadPoolExecutor: a task handed to an idle worker starts before post returns"
status: draft
updated: 2026-11-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10507 made `ThreadPoolExecutor#post` (`packages/ruby-compat/lib/thread-pool-executor.ts`) start a task on a NEW worker synchronously (`this._runWorker(task)`, the worker loop's first `await task()`), so a scheduled `FutureResult#executeOrSkip` (`packages/activerecord/lib/future-result.ts`) claims the query before the caller's `await` reaches `executeOrWait`. Without that, `load_async_test.rb:161-195` ("load async instrumentation is thread safe") ran the query in the foreground with `async: false` and hung.

The other arm of `post`, handing the task to an idle worker (`this._ready.pop()!(task)`), still resolves a waiter promise, so the task starts only after microtask hops. With `minThreads > 0` or a worker kept alive for `idletime`, an async query posted to an idle worker can still lose the race to the caller and run in the foreground. A Ruby idle worker picks the task off the queue concurrently (concurrent-ruby `RubyThreadPoolExecutor#ns_assign_worker`, not vendored).

## Acceptance criteria

- [ ] A task handed to an idle worker starts before `post` returns, as a new worker's does.
- [ ] A trails test posts to an executor with an idle worker and asserts the task ran before `post` returned.
- [ ] `load async instrumentation is thread safe` still passes on all three adapters, and the `LoadAsyncMultiThreadPoolExecutorTest` cases still pass.
