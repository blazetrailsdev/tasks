---
title: "F-4 — transactions + callbacks + touch"
status: done
updated: 2026-06-07
rfc: "0000-ar-test-compare-100"
cluster: clusters
deps: []
deps-rfc: []
est-loc: 250
pr: 3010
claim: "2026-06-07T22:40:41Z"
assignee: "f4-transactions-campaign"
blocked-by: null
---

## Context

Batch 1 shipped #2870 (3). 47 remaining. `transactions.test.ts` (33) mostly
permanent Ruby-only (throw/catch, Thread.kill, timeout) — next reachable:
`update should rollback on failure!` (needs Author→posts + validation rollback).
`transaction-callbacks.test.ts` (10): savepoint-scoped callbacks,
`before_committed_on_all_records`, belongs-to touch callbacks.
`touch_later_test.rb` (4): **HIGH-RISK** — wire through
`withTransactionReturningStatus`; own story.

## Acceptance criteria

- [ ] Reachable `transactions.test.ts` skips un-skipped; permanent Ruby-only → H-3.
- [ ] `transaction-callbacks.test.ts` (10) un-skipped.
- [ ] `touch_later_test.rb` addressed as a separate HIGH-RISK story.

## Notes

Ours: `transactions.test.ts`, `transaction-callbacks.test.ts`.
Rails: `test/cases/transactions_test.rb`, `transaction_callbacks_test.rb`.
