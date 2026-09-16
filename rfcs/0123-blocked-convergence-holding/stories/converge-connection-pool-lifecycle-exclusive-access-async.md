---
title: "converge-connection-pool-lifecycle-exclusive-access-async"
status: blocked
updated: 2026-09-11
rfc: "0123-blocked-convergence-holding"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 45
pr: null
claim: null
assignee: null
blocked-by: "dep converge-sync-connection-lease-per-checkout-verify (RFC 0146) is itself blocked pending an epic that makes to_sql/.connection async; cannot be scheduled until that dep unblocks"
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

`acquireConnectionSync` (`:548-560`) carries `@noRailsEquivalent PERMANENT`, but
Rails has only one `acquire_connection` (`connection_pool.rb:862`), so the
receipt is wrong.

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
- `acquireConnectionSync` is deleted.
- `ExclusiveConnectionTimeoutError` is still raised with Rails' message for a busy
  pool.
- Disconnect and discard pool tests are green on all three adapters.
