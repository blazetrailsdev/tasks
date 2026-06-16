---
title: "pool evicts connection on begin/commit/rollback failure"
status: claimed
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 24
pr: null
claim: "2026-06-16T22:12:43Z"
assignee: "pool-eviction-on-transaction-raise"
blocked-by: null
---

## Context

Connection-pool eviction on transaction begin/commit/rollback failure is not
modeled at the test layer (no low-level pool API to assert eviction). Rails
removes a connection from the pool when commit raises and rollback also raises,
or when begin raises after a successful begin.

Blocks un-skipping (transactions.test.ts):

- rollback dirty changes even with raise during rollback removes from pool (rails transactions_test.rb:~)
- rollback dirty changes even with raise during rollback doesnt commit transaction
- connection removed from pool when commit raises and rollback raises
- connection removed from pool when begin raises after successfully beginning a transaction

## Acceptance criteria

- [ ] Pool evicts a connection when commit+rollback both raise, and when begin
      raises after a successful begin.
- [ ] The 4 tests above are un-skipped and pass; no new gate-mismatches.
