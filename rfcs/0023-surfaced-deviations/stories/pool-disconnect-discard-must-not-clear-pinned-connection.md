---
title: "disconnect!/discard! must not clear the pinned connection"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: connection-pool.ts _disconnect (:1044-1066) and _discardBang (:1107-1130) both carry explicit 'No pin clearing here' blocks citing connection_pool.rb:454-465/484-492 and no longer null _fixturePin or clear _pinnedConnections; the only clear sites are the unpin paths (:791,:836) and remove (:1473)."
---

## Context

Rails clears `@pinned_connection` in exactly two places:

- `ConnectionPool#initialize`
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:267`)
- `ConnectionPool#unpin_connection!` (`:347`, and only once
  `@pinned_connections_depth` reaches zero)

`disconnect!` and `discard!` deliberately leave it alone. A pool that is
disconnected while pinned therefore still unpins cleanly at teardown —
`unpin_connection!` finds `@pinned_connection` and its
`raise "There isn't a pinned connection #{object_id}"` guard (`:341`) never
fires.

trails diverges: `ConnectionPool#_disconnect`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:975`)
and `#_discard` (`:1040`) both null `_fixturePin`, alongside a
`_pinnedConnections.clear()` on the same lines that should be checked against
Rails too — Rails clears neither collection there.

This is not theoretical. It is the blocker that stopped PR #6106 from porting
`setup_transactional_fixtures`' literal first step
(`test_fixtures.rb:175-180`, pinning `connection_pool_list(:writing)`
wholesale). With every writing pool pinned at setup, `base_test.rb`'s
`connection in utc time` — which calls `establishConnection` mid-test, so
`disconnectPoolFromPoolManager` disconnects the pinned pool — fails teardown
with:

```text
Error: There isn't a pinned connection #<ConnectionPool env_name="development" role="writing">
  at ConnectionPool.unpinConnectionBang (connection-adapters/abstract/connection-pool.ts:739)
```

Rails runs the same sequence without incident.

## Converged shape

Stop clearing `_fixturePin` in `_disconnect` and `_discard`, matching
`connection_pool.rb` — cleared only in the constructor and in
`unpinConnectionBang` at depth zero. Audit the adjacent
`_pinnedConnections.clear()` on both lines against Rails while you are in
there; Rails has no counterpart to either clear.

Note `connection-pool.ts:1398-1399` also nulls `_fixturePin` when the pinned
connection is removed; check that against Rails' `remove` (`:576`) as part of
the same pass.

## Acceptance criteria

- [ ] `_disconnect` and `_discard` no longer clear `_fixturePin`; the only
      clear sites match `connection_pool.rb:267` and `:347`.
- [ ] The `_pinnedConnections.clear()` calls on the same lines are either
      justified against a Rails counterpart at the call site or removed.
- [ ] Unblocks RFC 0064
      `pin-writing-pool-list-in-setup-transactional-fixtures`: with this
      landed, pinning `connectionPoolList("writing")` in
      `withTransactionalFixtures` setup keeps `base_test.rb`'s
      `connection in utc time` green. Verify by making that change locally,
      confirming green, then reverting it (the pin change itself belongs to
      that story).
- [ ] `connection-pool` suites, `base.test.ts`, `connection-handling.test.ts`
      and `test-fixtures.test.ts` stay green on all three lanes.
