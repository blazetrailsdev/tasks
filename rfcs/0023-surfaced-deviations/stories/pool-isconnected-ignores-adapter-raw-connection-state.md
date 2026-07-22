---
title: "ConnectionPool#isConnected checks membership, not adapters' connected? like Rails"
status: draft
updated: 2026-07-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `ConnectionPool#connected?` is `synchronize { @connections.any?(&:connected?) }`
(connection_pool.rb:427-429), where adapter `connected?` is
`!@raw_connection.nil?` (abstract_adapter.rb:649). Trails
`ConnectionPool#isConnected()` (connection-adapters/abstract/connection-pool.ts:569-571)
only checks pool membership: `this._connections != null && this._connections.length > 0`
— it does not consult each adapter's raw-connection state
(`AbstractAdapter#isConnected`, abstract-adapter.ts:1117 exists and is unused
here).

A pool holding checked-in adapters whose raw connections were closed
(adapter-level `disconnectBang` without pool removal) reports connected in
trails but not in Rails. `Base.isConnectedQ()` (connection-handling.ts:438)
and the new `.disconnect_all!` test (active-record.test.ts, PR #5088) sit on
top of this predicate; the test passes because `PoolConfig.disconnectAllBang`
also empties `_connections`, but the predicate itself diverges.

## Acceptance criteria

- [ ] `ConnectionPool#isConnected()` mirrors Rails: any pooled adapter with a live raw connection.
- [ ] active-record / query-cache "connected?" call sites still pass on all lanes.
