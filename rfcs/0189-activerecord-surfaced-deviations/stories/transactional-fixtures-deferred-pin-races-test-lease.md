---
title: "transactional-fixtures-deferred-pin-races-test-lease"
status: draft
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
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

Rails' transactional-fixtures subscriber pins a newly established pool
synchronously, inside the `!connection.active_record` notification
(`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:183-198`):
`pool.pin_connection!(lock_threads)` then `pool.lease_connection`, both before
`establish_connection` returns
(`connection_adapters/abstract/connection_handler.rb:149-151`).

trails cannot await inside the subscriber, so
`packages/activerecord/src/test-fixtures.ts`'s `setupTransactionalFixtures`
hands the pool to `deferConnectionPoolPin`, which pushes an un-awaited
`pool.leaseConnection().then(... pinConnectionBang ...)` onto `_pendingPins`.
Test code that leases right after `establishConnection` races it.
`ConnectionPool#leaseConnection` (`connection-adapters/abstract/connection-pool.ts`,
`lease.connection ||= await this.checkout()`) has no guard across that `await`,
so two leases from one execution context each check out a connection.

Visible since `activerecord-describes-are-named-test-case-constants` (trails#8898)
made every activerecord test an `ActiveRecord::TestCase`. On MariaDB,
`ConnectionTest#test_passing_flags_by_array_to_adapter`
(`test/cases/adapters/abstract_mysql_adapter/connection_test.rb:152-158`)
builds two `Mysql2Adapter`s from one config, and each pushes `FOUND_ROWS` onto
the shared `flags` array (`mysql2_adapter.rb` `initialize`), so the test reads
`["COMPRESS", "FOUND_ROWS", "FOUND_ROWS"]`. The test is parked as `it.skip`
under `// BLOCKED:` this story in
`packages/activerecord/src/adapters/abstract-mysql-adapter/connection.test.ts`.

## Acceptance criteria

- [ ] A pool established inside a transactional test is pinned before test
      code can lease from it, or concurrent leases from one execution context
      share one checkout. Either way, only one connection is checked out.
- [ ] `passing flags by array to adapter` is unskipped and green on the
      MariaDB lane, with Rails' body unchanged.
