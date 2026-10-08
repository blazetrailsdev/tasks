---
title: "load-async-multi-pool-tests-reestablish-under-transactional-fixtures"
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

`relation/load_async_test.rb` has two classes that re-establish `ActiveRecord::Base` and `ARUnit2Model` in `setup` while transactional fixtures hold a pinned connection:

- `LoadAsyncMultiThreadPoolExecutorTest` (`vendor/rails/v8.0.2/activerecord/test/cases/relation/load_async_test.rb:402-524`, 10 tests) — `establish_connection(config_hash.merge(min_threads: 0, max_threads: 10))` at `:410-414`, restored in `teardown` at `:417-422`.
- `LoadAsyncMixedThreadPoolExecutorTest` (`:526-611`, 2 tests) — swaps `ENV["RAILS_ENV"]` and `ActiveRecord::Base.configurations`, then `establish_connection(:primary)` / `(:animals)` at `:532-548`.

Both are `it.skip` stubs in `packages/activerecord/src/relation/load-async.test.ts`. The bodies were written and pass on SQLite (file database) when the describe is declared `fixtures([...], { useTransactionalTests: false })`, which Rails does not do. With Rails' default transactional fixtures every test fails in teardown:

```text
TypeError: Cannot read properties of null (reading 'execute')
  setBooleanPragma        packages/activerecord/src/sqlite/pragmas.ts:86
  configureConnection     packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1091
  attemptConfigureConnection / resetBang   connection-adapters/abstract-adapter.ts
  ConnectionPool.unpinConnectionBang       connection-adapters/abstract/connection-pool.ts:363
```

`establishConnection` disconnects the old pool (`ConnectionPool#disconnect`, `connection_pool.rb:452-467`), which closes the pinned adapter and resets its transaction. `teardownTransactionalFixtures` then calls `unpinConnectionBang` on that old pool, which takes the `reset!` arm (`connection_pool.rb:349-355`) and runs `configure_connection` against a nil raw connection (`sqlite3_adapter.rb:820-845` assigns pragmas on `@raw_connection` directly). trails' `unpinConnectionBang`, `disconnect`, `teardownTransactionalFixtures` and SQLite `configureConnection` each read line for line like Rails, so the difference is somewhere this investigation did not reach. It was not checked on PostgreSQL or MySQL, whose `configure_connection` goes through `with_raw_connection` and reconnects.

The bodies are a mechanical copy of the `LoadAsyncTest` bodies already enrolled in the same file.

## Acceptance criteria

- [ ] Find why Rails' teardown survives a pool re-established under transactional fixtures and converge trails to it.
- [ ] Enrol the 12 tests with Rails' bodies and default transactional fixtures; `LoadAsyncMultiThreadPoolExecutorTest` and `LoadAsyncMixedThreadPoolExecutorTest` are `describe.skipIf(inMemoryDb())`.
- [ ] Green on SQLite, PostgreSQL and MariaDB.
