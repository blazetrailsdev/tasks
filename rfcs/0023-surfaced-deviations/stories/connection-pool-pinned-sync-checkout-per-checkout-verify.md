---
title: "connection-pool-pinned-sync-checkout-per-checkout-verify"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ConnectionPool#checkout`'s pinned branch
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:646-670`)
no longer verifies the pinned connection on the synchronous path (PR #4439
removed the `fireAndForgetVerify` best-effort call to eliminate the last
fire-and-forget `verifyBang` site and its unhandled-rejection risk).

Rails re-runs `verify!` on every pinned checkout
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:554`),
and `verify!` self-heals: `abstract_adapter.rb:759` calls
`reconnect!(restore_transactions: true)` when the connection is no longer
`active?`. trails' `verifyBang` (`abstract-adapter.ts:1145`) mirrors that
reconnect-on-drop behavior.

After PR #4439:

- The async handout path — `checkoutAsync`
  (`connection-pool.ts:676`), which trails' modern query execution
  (`withConnection` → `checkoutAsync`) actually uses — still awaits `verifyBang`
  on every pinned handout, so per-checkout reconnect-on-drop parity holds there.
- The deprecated sync path — `.connection` getter → `leaseConnection` →
  sync `checkout()` — making repeated sync checkouts within one pinned session
  no longer verifies/self-heals per checkout. A connection that dies mid-session
  is recovered at query time (withRawConnection retry) rather than pre-emptively
  at checkout, a narrow divergence from Rails' unconditional per-checkout
  `verify!`.

Full sync-path parity is impossible without awaiting (the async-`verifyBang`
vs sync-`checkout()` impedance mismatch). Convergence requires routing the
remaining pinned sync-checkout callers (the deprecated `.connection` /
`leaseConnection` reuse path) through an awaitable handout so `verifyBang` runs
before every pinned checkout returns.

## Acceptance criteria

- Every pinned checkout — including repeated handouts within a single pinned
  session on the `leaseConnection` / deprecated `.connection` path — awaits
  `verifyBang` (and thus self-heals via reconnect-on-drop) before returning, at
  parity with Rails' unconditional per-checkout `verify!`.
- No reintroduction of fire-and-forget `verifyBang` (no dangling promise, no
  teardown-race swallow).
- Approach: route the pinned sync-checkout callers through an async path (e.g.
  an async `leaseConnection` variant used by the pinned-reachable callers), or
  document any residual sync caller as genuinely unreachable.
- A test exercises a subsequent (non-establishment) pinned checkout that
  observes the connection dying mid-session and asserts reconnect-on-drop, not
  just the immediate-next checkout after `pinConnectionBang`.
- No node: imports, no process., async fs only, no new runtime deps.
- 500 LOC ceiling; single PR from main.
