---
title: "Test bodies read a per-test leased connection, not Base.connection (reserved-word, schema-dumper, migration, primary-keys)"
status: ready
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Since trails#7985, `TestFixtures#teardownFixtures` calls `clear_active_connections!(:all)` (`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:159`). A test body that reads the deprecated `Base.connection` after a fixture teardown in the same file now raises under `permanent_connection_checkout = :disallowed` (`vendor/rails/activerecord/test/cases/helper.rb:27`). It only passes when an earlier `leaseConnection()` or a transactional pin has left the lease sticky. Rails' test files read `ActiveRecord::Base.lease_connection` throughout (e.g. `schema_dumper_test.rb:23`, `reserved_word_test.rb`'s `setup`, `migration_test.rb`).

trails#7985 converted only the 16 sites that went red. Order-dependent `Base.connection` reads remain, for example:

- `packages/activerecord/src/reserved-word.test.ts`: the `schema()` helper;

- `packages/activerecord/src/schema-dumper.test.ts`: about 50 reads;

- `packages/activerecord/src/migration.test.ts`: about 60 reads;

- `packages/activerecord/src/primary-keys.test.ts`: `auto_increments` / `int_defaults` hooks.

Across files that both call `fixtures()` and read `.connection`, that is about 500 reads in about 80 files. A describe reorder, or a new `useTransactionalTests: false` describe, will red them.

## Acceptance criteria

- In each file whose Rails counterpart reads `lease_connection` in `setup`, the port leases per test (`beforeEach(async () => { connection = await Base.leaseConnection(); })`) and reads that connection, mirroring the Rails `@connection` ivar.

- Split by file cluster if this goes over the LOC ceiling; this story covers `reserved-word`, `schema-dumper`, `migration` and `primary-keys`.
