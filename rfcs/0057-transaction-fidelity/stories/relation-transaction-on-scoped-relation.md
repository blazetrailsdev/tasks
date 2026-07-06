---
title: "Relation#transaction opens a transaction on a scoped relation without applying its scope"
status: in-progress
updated: 2026-07-06
rfc: "0057-transaction-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 8
pr: 4695
claim: "2026-07-06T19:23:55Z"
assignee: "relation-transaction-on-scoped-relation"
blocked-by: null
---

## Context

Surfaced converting `transactions.test.ts` (RFC 0019 `transactions-test-canonical`,
PR #4194). Rails opens a transaction directly on a scoped relation —
`Topic.where.not(id: topic.id).transaction { ... }` — to prove the scope is NOT
applied to finds inside (regression for rails/rails#50368,
`vendor/rails/activerecord/test/cases/transactions_test.rb:224`). trails' relation
delegation guard `guardBaseMethodDelegation`
(`packages/activerecord/src/relation/delegation.ts:223`) throws
`NotImplementedError` for `transaction` on a Relation, so the faithful body can't
run. The test `transaction does not apply default scope` is currently `it.skip`
in `transactions.test.ts`.

## Acceptance criteria

- [ ] `Relation#transaction` opens a transaction on the relation's klass while
      not applying the relation's scope to queries inside the block (Rails parity).
- [ ] Un-skip `transaction does not apply default scope` in `transactions.test.ts`;
      passes on sqlite + PG.
