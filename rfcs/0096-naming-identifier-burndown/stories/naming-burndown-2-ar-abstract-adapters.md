---
title: "Burn down the remaining 45 naming call-argument rows in the abstract connection adapter, schema/database statements, pool and cache"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 180
pr: 6419
claim: "2026-08-12T15:43:44Z"
assignee: "naming-burndown-2-ar-abstract-adapters"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in the abstract connection adapter, schema/database statements, pool and cache: **45 rows across 13 files**.

| Rows | File                                                                           |
| ---: | ------------------------------------------------------------------------------ |
|    7 | `packages/activerecord/connection-adapters/abstract/schema-statements.ts`      |
|    6 | `packages/activerecord/connection-adapters/abstract/database-statements.ts`    |
|    6 | `packages/activerecord/connection-adapters/schema-cache.ts`                    |
|    5 | `packages/activerecord/connection-adapters/abstract/schema-definitions.ts`     |
|    4 | `packages/activerecord/connection-adapters/abstract/transaction.ts`            |
|    3 | `packages/activerecord/connection-adapters/abstract-adapter.ts`                |
|    3 | `packages/activerecord/connection-adapters/abstract/connection-handler.ts`     |
|    3 | `packages/activerecord/connection-adapters/abstract/connection-pool.ts`        |
|    3 | `packages/activerecord/connection-adapters/abstract/quoting.ts`                |
|    2 | `packages/activerecord/connection-adapters/pool-config.ts`                     |
|    1 | `packages/activerecord/connection-adapters/abstract/connection-pool/queue.ts`  |
|    1 | `packages/activerecord/connection-adapters/abstract/connection-pool/reaper.ts` |
|    1 | `packages/activerecord/connection-adapters/abstract/query-cache.ts`            |

Representative rows (Ruby args → TS args):

- `connection-adapters/abstract-adapter.ts#unpreparedStatement` calling `add?`: Ruby `ref:objectId` → TS `ref:this`
- `connection-adapters/abstract-adapter.ts#registerClassWithPrecision` calling `extract_precision`: Ruby `ref:last` → TS `ref:sqlType`
- `connection-adapters/abstract-adapter.ts#registerClassWithLimit` calling `extract_limit`: Ruby `ref:last` → TS `ref:sqlType`
- `connection-adapters/abstract/connection-handler.ts#establishConnection` calling `set_pool_manager`: Ruby `ref:connectionDescriptor` → TS `ref:poolKey`
- `connection-adapters/abstract/connection-handler.ts#determineOwnerName` calling `new`: Ruby `ref:toS` → TS `ref:ownerName`
- `connection-adapters/abstract/connection-handler.ts#determineOwnerName` calling `new`: Ruby `ref:toS` → TS `ref:symbolName`
- `connection-adapters/abstract/connection-pool.ts#bulkMakeNewConnections` calling `checkin`: Ruby `ref:newConn` → TS `ref:conn`
- `connection-adapters/abstract/connection-pool.ts#attemptToCheckoutAllExistingConnections` calling `checkout_for_exclusive_access`: Ruby `ref:remainingTimeout` → TS `ref:checkoutTimeout`

Rename the locals and parameters to the Rails identifiers, camelCased per
`docs/ruby-ts-conventions.md`. Rename to the Rails identifier, not to a better
one: if Rails says `o`, the TS name is `o`. No behavior changes and no public
surface changes — these are body-local identifiers.

A row that turns out to be an a1 (argument order) or a3 (invented helper /
conversion) finding is **not** renamed away: file it against the RFC owning that
file and leave the row standing.

The counts above are a snapshot; re-measure before claiming, since sibling
wave-2 stories land against disjoint file sets but the totals move.

## Acceptance criteria

- [ ] Locals and parameters in the files listed above carry the Rails
      identifier, camelCased.
- [ ] `pnpm parity:api:calls:args:report` (after
      `API_COMPARE_FORCE=1 pnpm parity:api --calls` on a fresh `pnpm build`)
      shows the `naming` class down by the rows this story converged, and no
      new `shape` rows.
- [ ] Any row deliberately left standing is an a1/a3 finding, called out in the
      PR body with the follow-up story or RFC it belongs to.
- [ ] `pnpm lint` and the touched packages' tests pass; no public API change.
