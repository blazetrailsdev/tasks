---
title: "lease-connection-holds-pending-checkout"
status: in-progress
updated: 2026-11-26
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10798
claim: "2026-11-26T12:44:42Z"
assignee: "lease-connection-holds-pending-checkout"
blocked-by: null
closed-reason: null
---

## Context

Rails' `with_connection` / `lease_connection`
(`vendor/rails/v8.0.5.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:405-424`)
read `lease.connection` then write `lease.connection = checkout` atomically
(one thread per lease). trails' `checkout()` is async, so a second
`withConnection` on the same lease runs inside the `await` and sees an empty
lease. Today that is papered over by two module-level WeakMaps in
`packages/activerecord/lib/connection-adapters/abstract/connection-pool.ts`:
`pendingCheckouts` (used by `withConnection` ~:449, `withConnectionSync` ~:727,
`adoptConnection` ~:1107) and `pendingLeases` (`leaseConnection` ~:352), both
receipted `@inventedArm if — CONVERGEABLE with-connection-pending-checkout-join-needs-ruling`.

Operator chose convergence (2026-11-25). Proposed shape: `Lease#connection`
holds the in-flight checkout promise while pending
(`DatabaseAdapter | Promise<DatabaseAdapter> | null`), so `withConnection` and
`leaseConnection` keep Rails' exact two branches (`if lease.connection ... else
lease.connection = checkout`), with the else branch assigning the promise
synchronously before awaiting it.

## Acceptance criteria

- `pendingCheckouts` and `pendingLeases` are deleted; `withConnection`,
  `leaseConnection`, `withConnectionSync`, `adoptConnection` follow
  `connection_pool.rb:405-424` branch for branch.
- Every synchronous reader of `lease.connection` (`isActiveConnection`,
  `release`, `clear`, pin paths, etc.) handles the pending state; audit all
  call sites repo-wide.
- Trails tests "withConnection overlapping on an empty lease checks out one
  connection" and "leaseConnection overlapping on an empty lease checks out one
  connection" stay green.
- The two `@inventedArm if — CONVERGEABLE` receipts are removed; then close
  `with-connection-pending-checkout-join-needs-ruling` as done.
