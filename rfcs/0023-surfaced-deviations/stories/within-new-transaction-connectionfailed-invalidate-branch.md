---
title: "within_new_transaction: ConnectionFailed commit branch should invalidate! not rollback"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 40
pr: 3957
claim: "2026-06-23T02:51:17Z"
assignee: "within-new-transaction-connectionfailed-invalidate-branch"
blocked-by: null
---

## Context

Rails' `TransactionManager#within_new_transaction` commit path
(`activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:632-643`)
distinguishes two failure modes when `commit_transaction` raises:

```ruby
begin
  commit_transaction
rescue ActiveRecord::ConnectionFailed
  transaction.invalidate! unless transaction.state.completed?
  raise
rescue Exception
  rollback_transaction(transaction) unless transaction.state.completed?
  raise
end
```

The trails port (`packages/activerecord/src/connection-adapters/abstract/transaction.ts`,
`_withinNewTransactionBody`) only implements the generic `rescue Exception`
branch — it always calls `rollbackTransaction(transaction)` on commit failure.
The `ConnectionFailed` branch (which `invalidate!`s instead of attempting a
ROLLBACK on an already-dead connection) is missing. This predates PR #3507
(pool-eviction-on-transaction-raise), which only added the outer `throw_away!`
ensure and left this commit-path branch untouched.

Impact: when a commit fails specifically due to a dropped connection, trails
attempts a ROLLBACK on the dead connection rather than marking the transaction
invalidated. The outer `throw_away!` ensure (now present) still evicts the
connection, so the connection-leak symptom is covered, but the transaction
state diverges (`invalidated` vs `rolledback`) and child-transaction
invalidation propagation (`invalidate!` cascades to `@children`) does not fire.

## Acceptance criteria

- [ ] `_withinNewTransactionBody` commit `catch` distinguishes `ConnectionFailed`
      from other errors, mirroring Rails: `ConnectionFailed` →
      `transaction.invalidate!()` (unless completed); other → existing
      `rollbackTransaction(transaction)`.
- [ ] A test asserts that a `ConnectionFailed` raised from `commitTransaction`
      leaves the transaction in the `invalidated` state (and cascades to child
      savepoint transactions) rather than `rolledback`.
- [ ] No new gate-mismatches; test:compare/api:compare delta non-negative.
