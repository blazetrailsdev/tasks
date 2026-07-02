---
title: "Converge pool checkout/leaseConnection to async Rails-named methods"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: ["connection-pool-async-pinned-checkout-no-fire-and-forget"]
deps-rfc: []
est-loc: null
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Assumptions (author was away; defaults chosen — adjust freely)

- Scope: checkout/lease path now; disconnect/discard/flush/clearReloadable
  convergence is filed separately as backlog
  (`converge-connection-pool-lifecycle-async`).
- Sync consumers: keep a deprecation-gated sync shim for the deprecated
  `.connection` getter (returns the already-leased connection; cannot establish
  a new one synchronously), gated by the existing
  `permanent_connection_checkout` flag exactly as today.
- Root cause: unify the method surface only; `verifyBang` stays async and is
  awaited on the now-async checkout path (do not rework verify/close draining
  here).
- Slicing: per method-family, dep-serialized (all lives in one file).

## Context

trails shadows Rails' synchronous pool methods with async twins because
`verifyBang` (and driver `close()`) are async while Rails' equivalents are
synchronous. For the checkout/lease path:

- `checkout()` (sync, connection-pool.ts:646) vs `checkoutAsync()`
  (connection-pool.ts:686) — the async twin already awaits `verifyBang` on every
  pinned handout; the sync one cannot.
- `leaseConnection()` (connection-pool.ts:503) is sync with no async twin; its
  pinned reuse path inherits the sync checkout gap.
- `withConnection()` (connection-pool.ts:790) already routes through
  `checkoutAsync`.

Rails: `ConnectionPool#checkout` / `lease_connection`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:547`,
`:503`). Rails' `verify!` (`abstract_adapter.rb:759`) self-heals via
`reconnect!(restore_transactions: true)` on every pinned checkout.

PR #4439 removed the last fire-and-forget verify from sync `checkout()`, leaving
a documented residual: the deprecated sync `.connection` / `leaseConnection`
path does not verify/self-heal per checkout (tracked by
`connection-pool-pinned-sync-checkout-per-checkout-verify`). Converging the
Rails-named methods to async is the mechanism that closes that gap for good.

## Acceptance criteria

- The Rails-named methods `checkout` and `leaseConnection` become async
  (return Promise) with the async implementation currently in `checkoutAsync`;
  the non-Rails `checkoutAsync` twin is deleted. `withConnection` calls the
  Rails-named `checkout`/`leaseConnection` directly.
- Every pinned handout awaits `verifyBang` (reconnect-on-drop parity with Rails'
  per-checkout `verify!`) — this satisfies
  `connection-pool-pinned-sync-checkout-per-checkout-verify` (add its
  mid-session reconnect-on-drop test here or leave it as the verification story
  gated on this one).
- All callers (`connection-handling.ts`, `connection-handler.ts`,
  `migration.ts`, `tasks/database-tasks.ts`, `base.ts`) await the async
  methods. The deprecated `.connection` getter keeps a sync accessor returning
  the already-leased connection under the `permanent_connection_checkout`
  deprecation gate; it can no longer establish a new connection synchronously
  (document this; Rails deprecates the getter too).
- RFC note: fidelity here is method NAME + semantics, not Rails' synchronous
  return TYPE (Promise vs value is an intentional, documented divergence forced
  by async `verifyBang`) so it is not later "converged back" to sync.
- No fire-and-forget reintroduced; no unhandled rejections in
  `connection-pool.trails.test.ts`.
- No node: imports, no process., async fs only, no new runtime deps.
- Test names verbatim; test:compare delta non-negative; api:compare does not
  regress (removing the non-Rails `checkoutAsync` twin should improve parity).
- 500 LOC ceiling; single PR from main; no stacked PRs. If it exceeds the
  ceiling, split the caller-migration into a follow-up and land the pool-method
  signature change first.
