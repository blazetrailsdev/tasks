---
title: "Pool checkout hands out adapters with unestablished raw connections (Rails verifies/connects on checkout)"
status: in-progress
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5159
claim: "2026-07-23T16:31:35Z"
assignee: "checkout-leaves-raw-connection-unestablished"
blocked-by: null
closed-reason: null
---

## Context

Found on PR #5153 CI (MariaDB/PG lanes). Rails
`ConnectionPool#checkout` verifies the connection on handout
(connection_pool.rb `checkout_and_verify` → `verify!` →
abstract_adapter.rb `verify!` reconnects when not `active?`), so
immediately after `pool.checkout` the adapter has an established raw
connection and `pool.connected?` is true. In trails, checking out a
fresh real adapter (PostgreSQLAdapter/Mysql2Adapter via
`newRawTestAdapter`, packages/activerecord/src/test-adapter.ts:118-142)
leaves the raw handle unestablished: `adapter.isConnected()` — Rails
`connected?` = `!@raw_connection.nil?`
(abstract_adapter.rb:646-650) — stays false until the first query
drives the lazy connect. Observed as `pool.isConnected() === false`
right after `await pool.checkout()` on the mysql/pg lanes (PR #5153
first CI run); PR #5153 sidestepped it by using the adapter double.
Related: the pool async/sync surface convergence campaign;
verifyBang promotion path is
packages/activerecord/src/connection-adapters/abstract-adapter.ts:1227-1248.

## Acceptance criteria

- After `pool.checkout()` resolves, the handed-out adapter's raw
  connection is established (isConnected true), matching Rails
  checkout→verify!→connect semantics, on all three adapters.
- A lane-independent test asserts post-checkout isConnected; the PR
  #5153 regression test can then also run against `makePool` (real
  adapter) rather than only the double.
