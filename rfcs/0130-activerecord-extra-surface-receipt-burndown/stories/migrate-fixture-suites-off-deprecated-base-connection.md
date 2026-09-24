---
title: "migrate-fixture-suites-off-deprecated-base-connection"
status: closed
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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
closed-reason: "Premise gone / superseded. Test-body Base.connection reads were migrated to leaseConnection by trails#8020 (adapter-test-leases-connection-as-rails-does) and trails#8027 (test-bodies-lease-connection-per-test): on origin/main df293821ad, git grep -E 'Base\\.connection([^A-Za-z_]|$)' over packages/activerecord/src/**/*.test.ts hits only relation/load-async.test.ts:62 (was ~63 files). The remaining ask — drop the fixtures() default lease getter (test-fixtures.ts:757) — is owned, with the empirically measured 27-file residual, by fixtures-default-lease-getter-retires-with-its-dependents; its claimer should also pick up load-async.test.ts:62."
---

## Context

`TestFixtures#teardown_fixtures` ends with
`ActiveRecord::Base.connection_handler.clear_active_connections!(:all)`
(`activerecord/lib/active_record/test_fixtures.rb:157`), which releases the lease
and leaves `sticky` nil. The next test's deprecated `ActiveRecord::Base.connection`
then sees `pool.permanent_lease?` (`connection_pool.rb:321-323`,
`connection_lease.sticky.nil?`) and raises under
`permanent_connection_checkout = :disallowed` (`connection_handling.rb:274-285`),
which `packages/activerecord/src/cases/helper.ts:38` sets suite-wide.

Rails' own tests never hit this because they call `lease_connection`. About 63 trails
test files under `packages/activerecord/src` still read `Base.connection`. So
`fixtures()` (`packages/activerecord/src/test-fixtures.ts`) passes
`connection ?? (() => Base.leaseConnection())` to `registerFixtureHooks` so that each
test re-leases before it runs. Rails' `before_setup` has no such lease. #8014
removed `leaseFixtureConnection` and kept this per-test lease inline: without it,
~40 files red on every lane, all with this error.

## Acceptance criteria

- Every `Base.connection` read in `packages/activerecord/src/**/*.test.ts` becomes
  `await Base.leaseConnection()` (or `Base.withConnection`), matching Rails'
  test cases.
- `fixtures()` passes `connection` alone to `registerFixtureHooks`, so the default
  path no longer leases per test.
- The Active Record lanes stay green with `setPermanentConnectionCheckout("disallowed")`.
