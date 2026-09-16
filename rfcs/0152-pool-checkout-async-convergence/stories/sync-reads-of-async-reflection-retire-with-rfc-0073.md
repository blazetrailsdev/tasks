---
title: "sync-reads-of-async-reflection-retire-with-rfc-0073"
status: blocked
updated: 2026-09-04
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps:
  [
    "converge-sync-connection-lease-per-checkout-verify",
    "converge-connection-pool-lifecycle-exclusive-access-async",
    "connection-leasing-queue-internal-poll-carries-a-promise-arm",
  ]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-04T17:20:47Z"
assignee: "sync-reads-of-async-reflection-retire-with-rfc-0073"
blocked-by: "RFC 0073 (permanent-connection-checkout-disallowed) has not landed: all 16 of its stories are still ready, including retire-schema-cache-sync-readers-after-checkout-flip and arm-permanent-connection-checkout-disallowed. The six remaining CONVERGEABLE receipts in abstract-adapter.ts, abstract/connection-pool.ts and abstract/query-cache.ts only retire as those counterparts land."
closed-reason: null
---

## Context

The pool-checkout RFC `0000-pool-checkout-async-convergence` (Seam inventory §4, Design §4)
owns this story. It will be rehomed there once that RFC merges.

This is the receipt story for the port's sync twins of async checkout and
reflection. Its original gate was RFC 0073's
`arm-permanent-connection-checkout-disallowed`, which landed as trails#7781.
Arming that flag does not retire the twins, because JS cannot block a sync reader
on a checkout. The twins go when the pool seams converge (the sibling stories
under the same RFC), or they are ratified.

Citations on trails `0236d460b2`:

- `@noRailsEquivalent CONVERGEABLE`:
  - `connection-adapters/abstract/connection-pool.ts:269` `adapterReady`
  - `:394` `leaseConnectionSync`
  - `:415` `withConnectionSync`
  - `:672` `discardBangDraining`
  - `:791` `drainPendingCloses`
  - `connection-adapters/abstract-adapter.ts:1269` `internalSchemaCache`
- `@missingRailsCall with_connection`: `relation.ts:454,672,994` and
  `relation/query-methods.ts:1298`.
- `@missingRailsArgs where_sql`: `relation/finder-methods.ts:339`.

Two of these fall under CLAUDE.md sections instead of convergence:

- `internalSchemaCache` belongs to the schema-cache sync readers. Those are to
  be ratified in a trails CLAUDE.md section that has not landed yet, so its
  receipt is re-cited when that section merges, not before.
- The `relation*` sites belong to § "`Relation` is evaluated by an async query".

## Acceptance criteria

- Each pool member above is deleted as its seam converges, together with its
  receipt: `leaseConnectionSync` with the lease story, and `discardBangDraining`
  and `drainPendingCloses` with the exclusive-access story.
- `adapterReady` is either converged onto an eagerly registered adapter class, or
  filed as its own activerecord surfaced-deviations story with its receipt
  re-cited there (RFC Open question 3).
- Each site covered by a ratified CLAUDE.md section is re-cited `PERMANENT`
  against that section. `withConnectionSync` and the `relation*` sites go to the
  Relation section, and `internalSchemaCache` to the schema-cache section.
- `git grep "CONVERGEABLE sync-reads-of-async-reflection-retire-with-rfc-0073"`
  returns 0 hits.
- No new sync twin is added beside an async reader.
