---
title: "Pin every fixture connection pool, not just the primary"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 4
pr: 6103
claim: "2026-08-04T23:23:03Z"
assignee: "credit-mixin-methods-ported-in-their-own-file"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TestFixtures#setup_fixtures` collects **every** pool a fixture set
touches and pins each one:
`@fixture_connection_pools = ... map(&:pin_connection!)`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:177-184`), with
`teardown_fixtures` unpinning them all (`:146`).

trails' `withTransactionalFixtures`
(`packages/activerecord/src/test-fixtures/with-transactional-fixtures.ts`) pins
only the single pool behind the adapter its `getAdapter()` thunk returns — the
primary. PR #5681 made `fixtures()` seed each set through its model's own pool
(`leaseFixtureConnectionFor` in `test-fixtures/fixture-connection.ts`), which is
the Rails-faithful resolution, but rows seeded into the arunit2 secondary are
therefore **committed**, not rolled back: no pin exists on that pool. Teardown's
per-set DELETE (routed through the seeding connection by #5681) is what cleans
them up today, so behavior is correct but the isolation mechanism diverges from
Rails.

## Acceptance criteria

- `withTransactionalFixtures` pins every pool the declared fixture sets seed
  through, not just the primary — the set of pools resolved by
  `leaseFixtureConnectionFor` for the scope's sets.
- Teardown unpins each pinned pool, mirroring `test_fixtures.rb:146`.
- Secondary-database fixture rows roll back per test rather than relying on the
  DELETE fallback; the existing `shouldDeleteFixtureRows` PG carve-out keeps
  working.
- `multiple-db.test.ts` and the registry seed loop in `test-fixtures.test.ts`
  stay green on sqlite/PG/MySQL.
