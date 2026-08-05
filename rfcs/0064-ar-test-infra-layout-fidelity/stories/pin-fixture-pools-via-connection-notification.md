---
title: "pin-fixture-pools-via-connection-notification"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6106
claim: "2026-08-05T00:11:03Z"
assignee: "pin-fixture-pools-via-connection-notification"
blocked-by: null
closed-reason: null
---

## Context

Rails pins fixture connection pools discovered after `setup_fixtures` from an
`ActiveSupport::Notifications.subscribe("!connection.active_record")` block
installed by `setup_transactional_fixtures`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:183-200`): any
pool that shows up mid-test is pinned, leased and appended to
`@fixture_connection_pools`.

trails has no such notification, so
`packages/activerecord/src/test-fixtures/with-transactional-fixtures.ts` exports
`pinFixtureConnectionPool`, called from `fixtures()`' seeding loop
(`test-fixtures.ts`, right after `leaseFixtureConnectionFor`). That covers the
pools fixture sets seed through — the case that mattered, an arunit2 secondary
set whose rows were committing — but it is a named function where Rails has an
anonymous block, and it carries a `@noRailsEquivalent` receipt saying so. It
also does not cover a pool a _test body_ opens, which Rails' subscriber does.

The convergence is the notification: emit `!connection.active_record` from
`ConnectionPool#newConnection` and subscribe to it in
`setup_transactional_fixtures`, at which point the exported helper and its
receipt both go away. The existing "Known gap vs Rails" comment in
`withTransactionalFixtures` names the same hook.

## Acceptance criteria

- `ConnectionPool#newConnection` emits the `!connection.active_record`
  notification with Rails' payload keys (`connection_name`, `shard`).
- `withTransactionalFixtures` subscribes to it and pins/leases/appends newly
  seen pools, mirroring `test_fixtures.rb:183-200`, and unsubscribes in teardown
  (`:203`).
- `pinFixtureConnectionPool` and its `@noRailsEquivalent` tag are deleted; the
  `fixtures()` seeding loop no longer pins by hand.
- The secondary-pool regression test in `test-fixtures.test.ts`
  ("wraps the secondary pool's connection in the fixture transaction") stays
  green, and a pool opened inside a test body is pinned too.
