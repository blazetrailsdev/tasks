---
title: "sync-reads-of-async-reflection-retire-with-rfc-0073"
status: blocked
updated: 2026-09-29
rfc: "0123-blocked-convergence-holding"
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
blocked-by: "Re-verified 2026-09-29 on origin/main: steps 1-2 done (trails#8007, #7846); step 3 connection-leasing-queue-internal-poll-carries-a-promise-arm is BLOCKED (not ready as previously noted) on sync-acquire-cannot-complete-reap-before-retry, itself blocked. The schema-cache CLAUDE.md section has landed (trails#7831), so the internalSchemaCache re-cite AC is now doable, but leaseConnectionSync (connection-pool.ts:383), acquireConnectionSync (:521) and the relation.ts:463/682/969 + query-methods.ts:1236 with_connection receipts still wait on the pool chain."
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

Citations on trails `deb7897894`, after the re-scope below:

- `@noRailsEquivalent CONVERGEABLE`:
  - `connection-adapters/abstract/connection-pool.ts:779` `acquireConnectionSync`

That is the whole remaining surface. The other citations left this story:

- **Retired** with the two merged deps (trails#8007, #7846): `leaseConnectionSync`,
  `adapterReady`, `discardBangDraining`, `drainPendingCloses`, and the
  `@missingRailsArgs where_sql` at `relation/finder-methods.ts`. All five members
  are gone from the tree.
- **Re-cited `PERMANENT`**: `internalSchemaCache`
  (`connection-adapters/abstract-adapter.ts`), against the CLAUDE.md section
  § "Schema reflection peeks at a warm cache", which landed as trails#7831.
- **Re-pointed** to `with-connection-sync-is-a-lease-no-claude-md-section-ratifies`
  (RFC 0180): `withConnectionSync`. This story's old AC said to re-cite it
  `PERMANENT` against § "`Relation` is evaluated by an async query", which is
  not possible — that section and § "Schema reflection peeks at a warm cache"
  both explicitly decline to ratify a synchronous lease, the latter naming
  `withConnectionSync` in its scope boundary.
- **Re-pointed** to
  `relation-layer-with-connection-receipts-are-not-the-tosql-sites` (RFC 0180):
  the four `@missingRailsCall with_connection` sites, now `relation.ts:477`
  (`loadAsync`), `relation.ts:699` (`execMainQuery`),
  `relation/finder-methods.ts:500` (`applyJoinDependency`) and
  `relation/query-methods.ts:1134` (`arel`). The old AC sent them to
  § "`Relation` is evaluated by an async query", but that section ratifies
  `toSql`'s omitted calls, and `toSql`'s own receipts are already `PERMANENT` at
  `relation.ts:1057-1058`. None of the four is `toSql`.

`acquireConnectionSync` alone still waits on the pool-checkout chain:
`connection-leasing-queue-internal-poll-carries-a-promise-arm` ->
`sync-acquire-cannot-complete-reap-before-retry`, where RFC 0152 open question 2
was answered no (`poll()` stays synchronous for `acquireConnectionSync`,
`connection-pool.ts:526,531`).

## Acceptance criteria

- `acquireConnectionSync` is deleted together with its receipt as the
  pool-checkout seam converges.
- `git grep "CONVERGEABLE sync-reads-of-async-reflection-retire-with-rfc-0073"`
  returns 0 hits.
- No new sync twin is added beside an async reader.
