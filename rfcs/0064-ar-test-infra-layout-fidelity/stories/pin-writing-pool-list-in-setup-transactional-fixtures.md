---
title: "pin-writing-pool-list-in-setup-transactional-fixtures"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps:
  - pool-disconnect-discard-must-not-clear-pinned-connection
deps-rfc: []
est-loc: null
priority: null
pr: 6109
claim: "2026-08-05T01:11:00Z"
assignee: "pin-writing-pool-list-in-setup-transactional-fixtures"
blocked-by: null
closed-reason: null
---

## Context

`setup_transactional_fixtures` pins **every writing pool** as its literal first
step (`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:175-180`):

```ruby
@fixture_connection_pools = ActiveRecord::Base.connection_handler.connection_pool_list(:writing)
@fixture_connection_pools.each do |pool|
  pool.pin_connection!(lock_threads)
  pool.lease_connection
end
```

PR #6106 landed the _other_ half of `setup_transactional_fixtures` — the
`!connection.active_record` subscriber (`:182-200`) that pins pools established
mid-test. What is still missing is this setup line. In its place,
`withTransactionalFixtures` pins only the wrapped adapter's own pool, and
`pinFixtureConnectionPool` (`test-fixtures/with-transactional-fixtures.ts`,
`@noRailsEquivalent CONVERGEABLE`) pins the rest lazily from `fixtures()`'
seeding loop (`test-fixtures.ts`, right after `leaseFixtureConnectionFor`).

**This has been attempted twice and fails the same way both times** (once in PR #6103, once
in PR #6106). Pinning `connectionPoolList("writing")` wholesale breaks
`base_test.rb`'s `connection in utc time`:

```text
Error: There isn't a pinned connection #<ConnectionPool env_name="development" role="writing">
  at ConnectionPool.unpinConnectionBang (connection-adapters/abstract/connection-pool.ts:739)
```

That test calls `establishConnection` mid-test. The new pool displaces the old
one, `disconnectPoolFromPoolManager` disconnects it, and teardown then unpins a
pool whose pin is gone.

**Root cause — the actual blocker.** Rails clears `@pinned_connection` in
exactly two places: `initialize` (`connection_pool.rb:267`) and
`unpin_connection!` (`:347`). `disconnect!` and `discard!` deliberately leave it
alone, so a disconnected-but-pinned pool still unpins cleanly at teardown.
trails' `ConnectionPool#_disconnect` (`connection-pool.ts:975`) and `#_discard`
(`:1040`) both null `_fixturePin`. Until that is converged, Rails' setup line
cannot be ported literally.

## Acceptance criteria

- [ ] `ConnectionPool#_disconnect` / `#_discard` no longer clear `_fixturePin`,
      matching `connection_pool.rb` (cleared only in `initialize` and
      `unpin_connection!`). Check `_pinnedConnections.clear()` on the same lines
      against Rails while you are there.
- [ ] `withTransactionalFixtures` pins `Base.connectionHandler.connectionPoolList("writing")`
      in setup, mirroring `test_fixtures.rb:175-180`, instead of pinning only
      the wrapped adapter's pool.
- [ ] `pinFixtureConnectionPool` and its `@noRailsEquivalent` receipt are
      deleted, and `fixtures()`' seeding loop no longer pins by hand.
- [ ] `base_test.rb`'s `connection in utc time` stays green, as do
      `test-fixtures.test.ts`'s secondary-pool regression test ("wraps the
      secondary pool's connection in the fixture transaction") and the
      multi-`fixtures()` suites (`base.test.ts`, `autosave-association.test.ts`,
      `attribute-methods.test.ts`, `associations.test.ts`, `transactions.test.ts`,
      `persistence.test.ts`, `fixtures.test.ts`).
