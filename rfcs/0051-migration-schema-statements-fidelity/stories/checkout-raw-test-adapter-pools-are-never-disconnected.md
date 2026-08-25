---
title: "checkoutRawTestAdapter leaks its pool; call sites tear down only the adapter"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6231
claim: "2026-08-08T12:39:58Z"
assignee: "checkout-raw-test-adapter-pools-are-never-disconnected"
blocked-by: null
closed-reason: null
---

## Context

PR #6215 (`raw-test-adapters-should-come-from-pool-checkout`) converged
`newRawTestAdapter` onto the Rails shape: it is now the pool's `adapterFactory`
(`ConnectionPool#new_connection`,
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:701-707`),
and `checkoutRawTestAdapter()` (`packages/activerecord/src/test-adapter.ts`)
builds a `pool: 1` `ConnectionPool` and returns `pool.leaseConnection()`
(`connection_pool.rb:315-319`).

What it did NOT converge is the teardown half. Each call builds a fresh pool
and drops the reference; the seven call sites tear down only the _adapter_
(`adapter.close()`, `adapter.disconnectBang()`, `adapter.disconnect?.()`), never
the pool. So the pool is left holding a released-but-never-disconnected
connection, and its `Reaper` is only inert because the ambient config carries no
`reapingFrequency`.

Rails' own pool-mechanics tests do the opposite — they own the pool and tear it
down through it:

    # vendor/rails/activerecord/test/cases/connection_pool_test.rb:16-30
    def setup
      @pool = ConnectionPool.new(pool_config)
    end
    def teardown
      @pool.disconnect!
    end

`test-adapter.ts`'s own `_resetPooledTestAdapterForTests` already models this
correctly for the in-test pool (`_inTestPool.disconnectBang()`), and
`template-global-setup.ts` (PR #6211) tears down via
`pool.releaseConnection(); await pool.disconnectBang()`. The raw-adapter path is
the one that still leaks.

## Converged shape

`checkoutRawTestAdapter()` returns the pool alongside the adapter (as
`createPooledTestAdapter()` already does: `{ adapter, pool }`), and each of the
seven call sites tears down through `pool.releaseConnection()` +
`pool.disconnectBang()` in its `afterEach` / `afterAll` / `finally`, matching
`connection_pool_test.rb`'s `teardown`.

Call sites: `connection-adapters/schema-cache.test.ts:817`,
`connection-adapters/statement-pool.test.ts:114`,
`migration.trails.test.ts:47,56`, `test-adapter.trails.test.ts:22,33`,
`validations/uniqueness-validation.trails.test.ts:96`.

## Acceptance criteria

- [ ] `checkoutRawTestAdapter` hands back the pool it built.
- [ ] Every call site disconnects the pool rather than only the adapter.
- [ ] No test renamed; sqlite (file + `sqlite3_mem`), PG and MariaDB green.
