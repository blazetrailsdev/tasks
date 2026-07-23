---
title: "ConnectionPool#isConnected checks membership, not per-connection connected state"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-07-23T15:01:34Z"
assignee: "pool-connected-predicate-skips-per-connection-probe"
blocked-by: null
closed-reason: null
---

## Context

Found by per-entry wide-call verification (#5096), left as reason prose there.
Rails `ConnectionPool#connected?`
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:427-429)
is `synchronize { @connections.any?(&:connected?) }` — it probes each pooled
connection's live connected? state. Trails
(packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:570-572)
isConnected returns `_connections.length > 0` — pool membership only, so a
pool holding only dead/disconnected adapters still reports connected.
Related surface: the pool async/sync convergence campaign.

## Acceptance criteria

- isConnected consults each connection's connected state as Rails does.
- Wide-exclude reason for connection-pool.ts connected? updated to plain
  verified wording.
