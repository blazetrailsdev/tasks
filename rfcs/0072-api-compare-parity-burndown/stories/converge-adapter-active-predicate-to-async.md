---
title: "converge-adapter-active-predicate-to-async"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5967
claim: "2026-08-03T13:34:01Z"
assignee: "converge-adapter-active-predicate-to-async"
blocked-by: null
closed-reason: null
---

## Context

Split out of `mysql2-connected-predicate-folds-in-cached-ping-state` (which
converged `Mysql2Adapter#isConnected` onto Rails' `connected?`). The remaining
gap on that lane is the name `activeAsync`, a trails invention with no Rails
counterpart: Rails' `Mysql2Adapter#active?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:108`)
pings inline because the Ruby mysql2 driver blocks, while node-mysql2's `ping()`
returns a promise — so trails split it into the sync `active` getter plus the
async `activeAsync` probe.

Decision (recorded on that PR): DO the flip. It follows the precedent already
approved for `ConnectionPool` (RFC 0023 `*Async`-twin convergence): fidelity is
the Rails method NAME + semantics, not the sync return type — `Promise<boolean>`
vs `boolean` is an accepted, documented divergence. `active` becomes async and
`activeAsync` is deleted.

Declarations to flip (7):

- `packages/activerecord/src/connection-adapters/abstract-adapter.ts:1104`
- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:238`
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:288`
- `packages/activerecord/src/connection-adapters/mysql2-adapter.ts:153`
  (plus `activeAsync` there, which folds into `active` and is deleted)
- `packages/activerecord/src/support/fake-adapter.ts:57`
- test doubles: `packages/activerecord/src/adapter-connection.trails.test.ts:44`,
  `packages/activerecord/src/connection-pool.test.ts:70`

Call sites: ~88 `.active` references across `packages/` (grep
`\.active\b --include=*.ts packages/`). The two that need real thought are the
sync consumers `connection-adapters/abstract/transaction.ts` (the
`materializeTransactions` path) and `connection-adapters/abstract-adapter.ts`
(`verifyBang`) — both already sit on async call chains but read `active`
synchronously today.

## Acceptance criteria

- `get active(): boolean` becomes `async active(): Promise<boolean>` (or an
  async method named `active`) on all 7 declarations; `Mysql2Adapter#activeAsync`
  is deleted and its ping body folded into `active`.
- All call sites await; no sync consumer silently truthy-tests a Promise
  (add/keep a lint or type guard so `if (adapter.active)` can't regress).
- `Mysql2Adapter#isConnected()` keeps the Rails `connected?` semantics landed by
  the parent story (handle presence only, no `_activeState` term).
- `pnpm parity:api:extra --package activerecord` shows `activeAsync` gone with no new
  novel surface.
- If the flip exceeds the 500 LOC ceiling, ship the abstract + one adapter first
  and register the rest as further stories — do NOT fan out PRs.
