---
title: "CompositePrimaryKeyTest: non-transactional, per-test lease/create/drop as Rails"
status: ready
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `CompositePrimaryKeyTest` (`vendor/rails/activerecord/test/cases/primary_keys_test.rb:374-396`) sets `self.use_transactional_tests = false` and loads `fixtures :cpk_books, :cpk_orders`. It creates `uber_barcodes`, `barcodes_reverse` and `travels` in a per-test `setup`, after `ActiveRecord::Base.schema_cache.clear!` and `@connection = ActiveRecord::Base.lease_connection`, and drops them in `teardown`.

trails' `describe("CompositePrimaryKeyTest")` (`packages/activerecord/src/primary-keys.test.ts`):

- runs transactionally (`fixtures(["cpkAuthors", "cpkOrders", "cpkBooks"])` with no `useTransactionalTests: false`), and loads `cpkAuthors`, which Rails' test doesn't;

- creates the tables once in `beforeAll` and drops them in `afterAll`;

- reads `Base.connection` in the `primaryKeysOf` helper. That works only because the transactional pin keeps the lease sticky.

trails#7985 converged the neighbouring `PrimaryKeyAnyTypeTest` / `PrimaryKeyIntegerTest` onto per-test `beforeEach` lease and `afterEach` drop. This describe was left because it passes.

## Acceptance criteria

- `fixtures(["cpkBooks", "cpkOrders"], { useTransactionalTests: false })`, matching `primary_keys_test.rb:377-379` (drop `cpkAuthors` unless a ported test needs it).

- `beforeEach` clears the schema cache, leases the connection, and creates the three tables; `afterEach` drops them (`primary_keys_test.rb:381-400`).

- `primaryKeysOf` and the schema-dump tests read the leased connection, not `Base.connection`.
