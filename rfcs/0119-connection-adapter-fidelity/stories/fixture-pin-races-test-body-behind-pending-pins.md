---
title: "Fixture harness pins a new pool concurrently with the test body; converge to Rails' synchronous pin and drop pinConnectionBang's lock"
status: done
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: trails#7670
claim: "2026-09-10T18:29:19Z"
assignee: "retire-stale-read-uncommitted-suppression"
blocked-by: null
closed-reason: null
---

## Context

Rails pins a newly established pool synchronously, inside the
`!connection.active_record` subscriber
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:183-196`):
`pool.pin_connection!(lock_threads)` then `pool.lease_connection`, before
`establish_connection` returns to the test body. `pin_connection!`
(`connection_adapters/abstract/connection_pool.rb:325-338`) runs `verify!` then
`begin_transaction(joinable: false, _lazy: false)` with no point at which another
caller can touch the connection in between.

trails' harness cannot do that: `Notifications.instrument` is a plain synchronous
call (`packages/activerecord/src/connection-adapters/abstract/connection-handler.ts:188`)
whose fanout does not await a subscriber's promise, and `pinConnectionBang` is
async. So the subscriber in
`packages/activerecord/src/test-fixtures/with-transactional-fixtures.ts` pushes
`pinConnectionPool(newPool)` onto `pendingPins` and only awaits it in `afterEach`.
The pin therefore runs concurrently with the test body. (The subscriber itself
landed in PR #6106, story `pin-fixture-pools-via-connection-notification`.)

Observed in blazetrailsdev/trails#7662 (`BasicsTest > connection in local time` /
`connection in utc time`, `packages/activerecord/src/base.test.ts:1310`): the test
body's first query ran `verifyBang` -> `reconnectBang` on the pinned connection
between the pin's `verifyBang` and its `BEGIN`. `reconnectBang`'s `resetTransaction`
replaced the transaction manager; the pin's `BEGIN` then ran on the old manager.
At teardown `unpinConnectionBang` saw no open transaction, took the `reset!`
branch, and `configureConnection`'s `synchronous` pragma raised
`Safety level may not be changed inside a transaction`. Before #7662 the SQLite
pragma loop swallowed setter errors as warnings, which hid the leak.

PR #7662 closed the window by running `pinConnectionBang`'s `verify!` +
`begin_transaction` pair under the pinned connection's `lock` — the lock
`checkout`'s pinned arm already takes (`connection_pool.rb:550`,
`connection-pool.ts:491`). That lock has no Rails counterpart in
`pin_connection!`; it stands in for the atomicity Ruby's synchronous subscriber
provides. The repo's comment lint strips a prose justification at the call site
and no receipt shape fits an added lock, so this story is the receipt.

## Acceptance criteria

- [ ] The fixture harness no longer runs a new pool's pin concurrently with the
      test body: the pin completes before the test body's next use of that pool,
      matching `test_fixtures.rb:183-196`.
- [ ] `ConnectionPool#pinConnectionBang` returns to Rails' unlocked shape
      (`connection_pool.rb:325-338`) once the harness guarantees that ordering.
- [ ] `base.test.ts` `connection in local time` / `connection in utc time` stay
      green on every lane.
