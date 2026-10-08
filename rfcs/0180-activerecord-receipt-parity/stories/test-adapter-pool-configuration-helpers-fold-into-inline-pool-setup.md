---
title: "activerecord: test-adapter.ts's three pool-configuration helpers fold into the inline pool setup Rails writes"
status: blocked
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: convergeable
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: "parked by owner 2026-10-08: test-helper relocation across many call sites with no behaviour change; resume on an owner decision"
closed-reason: null
---

## Context

Split out of `activerecord-converge-test-infra-convergeable-receipts` (800 LOC ceiling): the three
pool-configuration helpers in `packages/activerecord/src/test-adapter.ts` are re-tagged
`@noRailsEquivalent CONVERGEABLE` onto this story.

Rails has no such helpers. The pool test builds its duplicate pool inline
(`vendor/rails/v8.0.2/activerecord/test/cases/connection_pool_test.rb:16-30`):

```ruby
config = ActiveRecord::Base.connection_pool.db_config
@db_config = ActiveRecord::DatabaseConfigurations::HashConfig.new(
  config.env_name, config.name,
  config.configuration_hash.merge(checkout_timeout: 0.2))
@pool_config = ActiveRecord::ConnectionAdapters::PoolConfig.new(ActiveRecord::Base, @db_config, :writing, :default)
@pool = ConnectionPool.new(@pool_config)
```

and a test that restores the suite connection calls `ActiveRecord::Base.establish_connection :arunit`
(`vendor/rails/v8.0.2/activerecord/test/support/connection.rb:35`).

trails hoisted three helpers:

- `ambientPoolConfiguration()` — a copy of the arunit configuration hash, read at module load from
  `testConfigurationHashes()` (`support/connection.ts`). 28 call sites in 12 files: `connection-pool.test.ts`,
  `shard-selector.test.ts`, `shard-selector.trails.test.ts`, `transaction-isolation.test.ts`,
  `schema-dumper.test.ts`, `test-adapter.trails.test.ts`, `adapters/sqlite3/transaction.test.ts`,
  `connection-adapters/connection-handler.test.ts`, `connection-handler.trails.test.ts`,
  `connection-handlers-multi-pool-config.test.ts`, `support/adapter-helper.ts`, `tasks/database-tasks.test.ts`.
  Several are restore sites (`Base.establishConnection(ambientPoolConfiguration())` in `schema-dumper.test.ts`,
  `tasks/database-tasks.test.ts`, `transaction-isolation.test.ts`), where `Base.connectionPool()` is not the
  arunit pool at the time of the call, so each site needs its Rails test read first.
- `rawTestAdapterConfiguration()` — that hash plus per-driver caps (`max: 1` on PostgreSQL,
  `connectionLimit: 1` and `flags: ["FOUND_ROWS"]` on MySQL), which Rails' `configuration_hash` does not
  carry. 3 call sites: `connection-pool.test.ts`, `connection-pool.trails.test.ts`, `pooled-connections.test.ts`.
- `checkoutRawTestAdapter()` — builds a `pool: 1` pool over that hash and leases its connection. 7 call
  sites: `migration.trails.test.ts`, `test-adapter.trails.test.ts`, `connection-adapters/statement-pool.test.ts`,
  `connection-adapters/schema-cache.test.ts`, `validations/uniqueness-validation.trails.test.ts`.

The driver caps are the open question: they exist so one trails adapter maps to one server connection.
Whether the adapters need them from the test configuration, or should take them from the pool the way
Rails' one-connection-per-adapter model does, decides the shape of the last two.

## Acceptance criteria

- [ ] Every `ambientPoolConfiguration()` call site reads `Base.connectionPool().dbConfig.configurationHash`, or restores with `establishConnection("arunit")` where the Rails test does; the helper and its receipt are deleted.
- [ ] `rawTestAdapterConfiguration()` and `checkoutRawTestAdapter()` are deleted with their receipts; each caller builds its pool inline as `connection_pool_test.rb:16-30` does. If the driver caps cannot go, that is filed with the specific adapter-level blocker, not re-tagged `PERMANENT`.
- [ ] `pnpm parity:api:extra:gate` stays rowless; the sqlite, postgres and mariadb lanes stay green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate
```
