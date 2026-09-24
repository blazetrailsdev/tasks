---
title: "converge-fixture-raw-adapter-arm-onto-pool-walk"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: trails#8054
claim: "2026-09-24T20:04:09Z"
assignee: "converge-fixture-raw-adapter-arm-onto-pool-walk"
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-with-transactional-fixtures-onto-test-fixtures-setup`, which
deleted `withTransactionalFixtures` / `leaseFixtureConnection` and moved every caller
onto `fixtures([], { connection })`.

Rails' `TestFixtures#setup_transactional_fixtures`
(`activerecord/lib/active_record/test_fixtures.rb:170-198`) walks
`connection_handler.connection_pool_list(:writing)` and `pin_connection!` /
`lease_connection`s each pool; `teardown_transactional_fixtures` (`:200-210`)
`unpin_connection!`s them. There is no adapter getter.

trails' `setupTransactionalFixtures` / `teardownTransactionalFixtures`
(`packages/activerecord/src/test-fixtures.ts`) additionally call
`pinFixtureAdapters` / `unpinFixtureAdapters`, which walk `_fixtureAdapters` (the
`connection:` getters passed to `fixtures()`):

- a pooled adapter not on the handler (`createPooledTestAdapter`) is pinned like a
  handler pool;
- a pool-less adapter (`adapter.pool` null / `NullPool`, e.g. a bare
  `new BetterSQLite3Adapter(...)`) gets a raw `transactionManager.beginTransaction`
  and a rollback loop at teardown.

Callers passing `connection:` include `support/setup-adapter-suite.ts`,
`encryption/*.test.ts`, `adapters/postgresql/{datatype,infinity}.test.ts` and
`test-fixtures/with-transactional-fixtures.trails.test.ts`.

## Acceptance criteria

- Every `connection:` caller's adapter reaches `setupTransactionalFixtures` through
  a pool on `Base.connectionHandler` (establish the pool rather than hand a bare
  adapter), so the pool walk at `test_fixtures.rb:175-179` covers it.
- `pinFixtureAdapters`, `unpinFixtureAdapters`, `_fixtureAdapters` and the
  `connection:` option are deleted; `setupTransactionalFixtures` /
  `teardownTransactionalFixtures` match `test_fixtures.rb:170-210` line for line.
- `git grep converge-fixture-raw-adapter-arm-onto-pool-walk` returns nothing.
