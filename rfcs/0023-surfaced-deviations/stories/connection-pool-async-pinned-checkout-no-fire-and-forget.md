---
title: "connection-pool-async-pinned-checkout-no-fire-and-forget"
status: claimed
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-02T21:21:56Z"
assignee: "connection-pool-async-pinned-checkout-no-fire-and-forget"
blocked-by: null
closed-reason: null
---

## Context

The pinned branch of the **synchronous** `ConnectionPool#checkout`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:646-660`)
calls `verifyBang()` as fire-and-forget:

```ts
checkout(): DatabaseAdapter {
  const pinned = this._resolvePinnedConnection();
  if (pinned) {
    // ...
    fireAndForgetVerify(this, pinned as unknown as { verifyBang(): void | Promise<void> });
    return pinned;
  }
  ...
}
```

Root cause is an impedance mismatch: Rails' `verify!`
(`connection_pool.rb:554`, `@pinned_connection.verify!`) is **synchronous** and
probes the socket, but trails' `verifyBang` is **async** (a real backend issues a
liveness round-trip) and the sync `checkout()` API can't await it. The
`fireAndForgetVerify` helper (same file, ~line 1378) currently mitigates this by
swallowing **only** the teardown race (pool disconnected/discarded → `_connections`
no longer tracks the connection) and re-raising genuine failures. `pinConnectionBang`
(line ~568) already `await`s `verifyBang` and propagates; `checkoutAsync`
(line ~663-671) already awaits it too. So the sync `checkout()` pinned branch is
the **only** remaining fire-and-forget site.

Two alternatives were investigated and rejected during PR #4432
(story `connection-pool-trails-pin-callback-tests-use-sqlite-double`):

- **Recency short-circuit in `verifyBang`** (skip the `;` probe when verified
  within `verifyTimeout`): PROVEN UNSAFE. It breaks
  `adapter.test.ts:1106` "active transaction is restored after remote
  disconnection" (PG-only) — `verifyBang`'s socket probe is exactly how trails
  detects a remote disconnection and reconnects to restore the open transaction
  (see the divergence comment at `adapter.test.ts:1099-1105`). Suppressing the
  probe on a recently-active connection lets a mid-pin remote kill go undetected.
  The probe is the point; it can't be cached away.

- **Keep the scoped-swallow** (current state): faithful and reviewer-approved,
  but still structurally fire-and-forget on the sync pinned checkout.

This story pursues the remaining option: **make the pinned checkout path async**
so `verifyBang` is awaited and fire-and-forget is eliminated entirely without
sacrificing remote-disconnect detection.

## Acceptance criteria

- The pinned checkout no longer fires-and-forgets `verifyBang`: the verify is
  awaited on whatever path a pinned connection is handed out, so a genuine
  verify failure propagates to the caller (as `checkoutAsync` already does) and
  remote-disconnect detection (`adapter.test.ts` "active transaction is restored
  after remote disconnection") still passes on PG.
- `fireAndForgetVerify` and its teardown-race swallow are removed (or the only
  remaining `verifyBang` caller that can't await is documented as genuinely
  unreachable).
- Approach: route pinned checkout through an async path — e.g. callers that may
  hit a pinned pool use `checkoutAsync`, or `leaseConnection`
  (`connection-pool.ts:503-510`, sole non-test sync `checkout()` caller besides
  the internal helper at ~line 1560) grows an async variant. Weigh the ripple
  against Rails' synchronous `ConnectionPool#checkout` / `lease_connection` API
  shape; if the sync API must stay, scope the async path to only the pinned
  branch's callers.
- No `node:*` imports, no `process.*`, async fs only, no new runtime deps.
- Test names verbatim; `test:compare` delta non-negative. All three lanes
  (sqlite/postgres/mysql) green, no unhandled rejections in
  `connection-pool.trails.test.ts`.
- 500 LOC ceiling; single PR from main; no stacked PRs.
