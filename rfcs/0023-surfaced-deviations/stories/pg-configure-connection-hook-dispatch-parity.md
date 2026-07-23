---
title: "PG: converge configure_connection hook dispatch (argless hook, reset-path dispatch)"
status: draft
updated: 2026-07-23
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
closed-reason: null
---

## Context

PR #5137 converged the connect-path configure_connection dispatch (Rails
connect! = verify! → reconnect! → attempt_configure_connection) for
sqlite/PG/MySQL, but two PG-side asymmetries remain:

- `PostgreSQLAdapter#configureConnection(client?)`
  (packages/activerecord/src/connection-adapters/postgresql-adapter.ts:3058)
  takes a client arg and is a NO-OP when called argless. Rails'
  `configure_connection` (postgresql_adapter.rb:956) is argless and operates on
  `@raw_connection`. Consequence: the base `reconnectBang` lifecycle's
  `attemptConfigureConnection` (abstract-adapter.ts:2492, mirrors
  abstract_adapter.rb:1216) dispatches a no-op on PG; the real hook dispatch
  happens inside `_acquireFreshClient` (postgresql-adapter.ts:~1406,
  `await this.configureConnection(client)`). Works (single dispatch,
  adapter_test.rb:852 passes) but the dispatch site diverges from Rails.
- The `resetBang` reconfigure barrier (postgresql-adapter.ts:~3014) still calls
  `_maybeConfigureConnection` directly, bypassing the overridable public hook.
  Rails' `reset!` (postgresql_adapter.rb:371) ends in `configure_connection`,
  so a user override observes the reset-path dispatch in Rails but not in
  trails. NOTE the barrier is deadlock-sensitive (see comment at ~828: configure
  queries must run on the raw socket, not through withRawConnection).

## Acceptance criteria

- [ ] `configureConnection` on PG converges toward Rails' argless hook shape
      operating on the current raw connection (or the deviation is justified at
      the call site with the node-pg acquire-ordering constraint).
- [ ] The resetBang reconfigure routes through the public overridable hook so a
      per-instance `configureConnection` override observes reset-path
      dispatches as in Rails.
- [ ] adapter_test.rb:852 recovery test and the PG lifecycle suites
      (disconnected.test.ts, adapters/postgresql/connection.test.ts) stay green.
