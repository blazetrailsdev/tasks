---
title: "Mysql2Adapter#active sync getter should reflect real connection state (converge, not just eager connect!)"
status: in-progress
updated: 2026-07-05
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4612
claim: "2026-07-05T14:07:44Z"
assignee: "mysql2-active-sync-getter-reflects-connection-state"
blocked-by: null
closed-reason: null
---

## Context

PR #4605 (story `mysql2-active-reflects-connection-state-for-connect-bang`)
satisfied its acceptance criterion via the **eager `connectBang()`** option
(Rails' public `connect!`), NOT by converging the sync `active` getter. So the
underlying deviation the story title named still stands:

`Mysql2Adapter#active`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts` ~L122) still
returns `!_permanentlyClosed && !_isFakeConnection && _activeState`, with
`_activeState` defaulting to `true`. A freshly-constructed standalone adapter
therefore reports `active === true` before any connection exists — unlike Rails'
mysql2 `active?` (mysql2_adapter.rb:108-117), which is `connected? && @lock.synchronize { @raw_connection&.ping && verified! }` — i.e. false when
`@raw_connection` is nil and only true when a live ping succeeds.

trails already has the async ping in `activeAsync()` (does `ping()` and updates
`_activeState`), and `isConnected()` mirrors Rails `connected?`. The gap is the
**sync `active` getter**: it neither requires `_client !== null` (Rails
`connected?`) nor reflects a real ping.

Converging it is non-trivial because the sync getter is read on hot paths
(`verifyBang` at abstract-adapter.ts ~L1160; `abstract-mysql-adapter.ts:593`
FK-checks restore; `transaction.ts:822`). Making it require `_client` flips
`verifyBang` to take the reconnect path on the first query of every mysql2
adapter — see the analysis in PR #4605. That needs its own scoped change +
MySQL CI validation, which is why #4605 took the eager-connect route instead.

## Acceptance criteria

- [ ] `Mysql2Adapter#active` (sync getter) reflects real connection state:
      false when `_client === null` / never-connected (Rails `connected?`),
      matching mysql2 `active?`'s `connected?` guard.
- [ ] Verify the hot-path readers (`verifyBang`, `disableReferentialIntegrity`
      restore, transaction materialization) behave correctly when `active`
      becomes accurate — first-query connect must still succeed (lazy
      `_ensureClient` is the safety net).
- [ ] MySQL/MariaDB CI green (this is adapter-gated; can't be validated on
      sqlite locally).
- [ ] No bespoke tables; no bending of Rails assertions.
