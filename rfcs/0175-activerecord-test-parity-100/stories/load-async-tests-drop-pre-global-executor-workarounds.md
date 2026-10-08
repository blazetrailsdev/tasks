---
title: "activerecord: LoadAsyncTest bodies and the load_async trails tests drop the pre-global-executor workarounds"
status: draft
updated: 2026-10-08
rfc: "0175-activerecord-test-parity-100"
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

trails#8692 made the test `connect()` set `async_query_executor = :global_thread_pool` as `ARTest.connect` does (`vendor/rails/v8.0.2/activerecord/test/support/connection.rb:22`), and made `blazetrails/no-conditional-in-test` admit an `inMemoryDb()` branch. Three older pieces of `load_async` test code predate both and still carry the workarounds:

- `packages/activerecord/src/relation/load-async.test.ts`, `LoadAsyncTest` — `scheduled?`, `null scheduled?` and `reset` assert both arms of Rails' `if in_memory_db? … else … end` (`vendor/rails/v8.0.2/activerecord/test/cases/relation/load_async_test.rb:16-49`) as `expect(inMemoryDb() && x).toBeFalsy(); expect(inMemoryDb() || x).toBeTruthy()`. The Rails shape is the `if` / `else`, which the lint rule now allows.
- Same file, `notification forwarding` omits the `wait_for_async_query` call Rails makes at `load_async_test.rb:109`, and reads the connection through `Base.connection` with a cast where Rails calls `Post.lease_connection` (`:112-113`). `waitForAsyncQuery` now exists in `packages/activerecord/src/cases/helper.ts`.
- `packages/activerecord/src/relation-load-async.trails.test.ts` and `packages/activerecord/src/future-result.trails.test.ts` still set the executor, start their own `AsynchronousQueriesTracker` session and patch `pool.asyncExecutor` in `beforeEach`, then set the executor back to `null` in `afterEach`. Pools already carry the global executor and `TestFixtures#setup_asynchronous_queries_session` (`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:160-162`) already starts the session.

## Acceptance criteria

- [ ] The three `LoadAsyncTest` bodies use Rails' `if in_memory_db?` / `else` arms.
- [ ] `notification forwarding` calls `waitForAsyncQuery()` and reads `Post.leaseConnection()`, as Rails does.
- [ ] The two `.trails.test.ts` files drop the executor / tracker / pool patching that `connect()` and the fixtures now provide, and still pass.
