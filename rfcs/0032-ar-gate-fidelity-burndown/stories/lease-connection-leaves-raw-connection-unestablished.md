---
title: "leaseConnection hands out adapters with unestablished raw connections (Rails verifies on checkout)"
status: claimed
updated: 2026-07-25
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-25T13:26:54Z"
assignee: "lease-connection-leaves-raw-connection-unestablished"
blocked-by: null
closed-reason: null
---

## Context

Surfaced on PR #5286 (connection-handling-ambient-connection). The sibling
story `checkout-leaves-raw-connection-unestablished` (RFC 0032, PR #5159) is
marked done, but the residue persists on the `leaseConnection` path.

Once `connection-handling.test.ts`'s `ConnectionHandlingTest` block stopped
running on a hardcoded SQLite config and bound to the ambient test connection,
`is_connected?` failed on the PostgreSQL lane:

```ts
await pool.leaseConnection();
expect(Base.isConnectedQ()).toBe(true); // → false on PG/MySQL
```

`ConnectionPool#isConnected()`
(connection-adapters/abstract/connection-pool.ts:570) is
`_connections.some((conn) => conn.isConnected())`, mirroring Rails'
`connected?`. Rails' `ConnectionPool#checkout` runs `checkout_and_verify`
(connection_pool.rb:942) → `verify!` (abstract_adapter.rb:759), so the adapter
has an established raw connection the moment checkout returns. trails'
`leaseConnection` hands back an adapter whose raw handle is still unopened
until the first query drives the lazy connect.

PR #5286 worked around it at the call site with an explicit
`await (await pool.leaseConnection()).verifyBang()`
(connection-handling.test.ts, `is_connected?`). That workaround should be
removable once the pool verifies on lease.

`verifyBang` promotion path:
packages/activerecord/src/connection-adapters/abstract-adapter.ts:1228.

## Acceptance criteria

- [ ] After `pool.leaseConnection()` resolves, the leased adapter's raw
      connection is established — `pool.isConnected()` / `Base.isConnectedQ()`
      is true without a prior query, on all three lanes.
- [ ] Confirm whether `checkout()` (covered by PR #5159) and `leaseConnection()`
      share a verify chokepoint; if not, converge them on one.
- [ ] Drop the explicit `verifyBang()` workaround from
      `connection-handling.test.ts`'s `is_connected?` case and show it still
      passes on PG/MySQL.
