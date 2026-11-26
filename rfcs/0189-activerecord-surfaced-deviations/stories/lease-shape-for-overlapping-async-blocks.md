---
title: "lease-shape-for-overlapping-async-blocks"
status: draft
updated: 2026-11-26
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
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

`lease-holds-count-overlapping-blocks` asked to delete the module-private
`leaseHolds` WeakMap in
`packages/activerecord/lib/connection-adapters/abstract/connection-pool.ts`
(~:194) so that `withConnection`'s ensure follows
`vendor/rails/v8.0.5.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:405-427`.
The operator first chose "fork the lease per block" (2026-11-26): run the
checkout branch under `IsolatedExecutionState.fork(pool, …)` with a fresh
`Lease`, and have `connectionLease()` read the forked lease first. A spike of
that shape (deleting `leaseHolds`) failed 8 tests in
`packages/activerecord/test/cases/connection-pool.trails.test.ts`, with two real
regressions:

1. A nested `withConnection` that outlives its owner (an unawaited inner block,
   "withConnection keeps the lease for a joiner that outlives the checkout's
   owner") loses its connection when the owner's fork releases it.
2. `Promise.all` siblings in one context each check out their own connection
   instead of sharing one. On a size-1 pool, `withConnectionSync` raises
   "borrowed a busy connection" ("overlapping withConnectionSync promise blocks
   release the lease after the last settles"), and N concurrent queries take N
   pool slots.

The operator then deferred the story pending a design.

## Acceptance criteria

- Choose a lease shape for overlapping async blocks in one execution context
  that keeps both behaviours above (or explicitly rules them away, with an
  operator ruling recorded in `packages/activerecord/CLAUDE.md`), or rule
  `leaseHolds` PERMANENT.
- Record the decision so `lease-holds-count-overlapping-blocks` can converge or
  close against it.
