---
title: "converge-connection-pool-lifecycle-exclusive-access-async"
status: claimed
updated: 2026-09-16
rfc: "0152-pool-checkout-async-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 45
pr: null
claim: "2026-09-16T22:56:18Z"
assignee: "converge-connection-pool-lifecycle-exclusive-access-async"
blocked-by: null
closed-reason: null
---

## Context

The pool-checkout RFC `0000-pool-checkout-async-convergence` (Seam inventory §2, Design §2)
owns this story. It will be rehomed there once that RFC merges.

Rails' `checkout_for_exclusive_access` is `checkout(checkout_timeout)`, rescuing
`ConnectionTimeoutError` into `ExclusiveConnectionTimeoutError`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:802-820`).
trails' `checkoutForExclusiveAccess`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:1045-1047`)
calls `pool.acquireConnectionSync(checkoutTimeout)` instead. The reason is that
`checkout` is async (it awaits `verifyBang`), and the caller,
`attemptToCheckoutAllExistingConnections` (`:1010`), runs inside the synchronous
`withExclusivelyAcquiredAllConnections` block.

This causes two divergences:

- The acquired connection skips `checkout_and_verify`
  (`connection_pool.rb:942`).
- The timeout is raised from a different call site.

`acquireConnectionSync` (`:548-560`) stays. It is the no-wait half of
`acquire_connection` (`connection_pool.rb:862-880`) and backs the sync
`withConnectionSync` scope. This story only removes it from the sweep.

The stale `converge-connection-pool-lifecycle-async` citation this story first
asked to remove is already gone.

The earlier blocker said the dependency on
`converge-sync-connection-lease-per-checkout-verify` sat behind the NullLock
default. It does not, and this story does not depend on that one. Each touches a
different acquire path.

## Acceptance criteria

- `checkoutForExclusiveAccess` awaits the Rails-named `checkout`, so
  `checkout_and_verify` runs.
- `attemptToCheckoutAllExistingConnections` and
  `withExclusivelyAcquiredAllConnections` are async. `disconnect`, `discard!` and
  `clear_reloadable_connections` await them.
- Per CLAUDE.md § "The pool monitor guards only sections that span an `await`",
  each of those bodies that now awaits moves onto `synchronize`, and that section
  is updated in the same PR.
- The sweep does not call `acquireConnectionSync`.
- `ExclusiveConnectionTimeoutError` is still raised with Rails' message for a busy
  pool.
- `discardBangDraining` (`connection-pool.ts:674`, read by `pool-config.ts:128`)
  and `drainPendingCloses` (`:793`) are deleted along with their
  `CONVERGEABLE sync-reads-of-async-reflection-retire-with-rfc-0073` receipts,
  because the awaited sweep makes them unnecessary.
- Disconnect and discard pool tests are green on all three adapters.
