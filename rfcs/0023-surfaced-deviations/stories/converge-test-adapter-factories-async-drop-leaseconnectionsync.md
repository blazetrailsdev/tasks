---
title: "Converge test-adapter factories to async, drop leaseConnectionSync escape hatch"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`converge-connection-pool-checkout-lease-async` (PR #4466) made
`ConnectionPool#checkout` / `#leaseConnection` async (they await per-checkout
`verifyBang`). To avoid an async cascade through ~55 synchronous test-infra call
sites, that PR introduced a trails-only sync escape hatch
`ConnectionPool#leaseConnectionSync` (packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:~529)
that establishes/resolves a lease WITHOUT the async verify. It is consumed by:

- `createTestAdapter` / `createSidecarTestAdapter` (packages/activerecord/src/test-adapter.ts:218,250,270)
- the deprecated sync `.connection` getter (packages/activerecord/src/connection-handling.ts)
- `migrationConnection` / `_arConfig.leaseConnection` (tasks/database-tasks.ts, base.ts)

`leaseConnectionSync` is a divergence: a trails-only sync twin of the Rails-named
async method. Eliminating it for the eliminable paths (the test-adapter factories,
which have ~55 callers that could be `await`ed) removes the divergence for those
sites. The genuinely-sync `.connection` property getter cannot be awaited and its
lost per-checkout self-heal is tracked separately by
`connection-pool-pinned-sync-checkout-per-checkout-verify`; this story does NOT
cover that path.

## Acceptance criteria

- `createTestAdapter` / `createSidecarTestAdapter` become async (or their ~55
  call sites otherwise await a real `leaseConnection`), so the test-adapter
  factories no longer use `leaseConnectionSync`.
- `leaseConnectionSync` is removed if no non-getter consumers remain, or its
  remaining consumers are narrowed to only the genuinely-sync `.connection`
  getter path with a doc comment saying so.
- No test:compare / api:compare regression; test names verbatim.
- 500 LOC ceiling (split if needed; caller-migration is mechanical await work).
