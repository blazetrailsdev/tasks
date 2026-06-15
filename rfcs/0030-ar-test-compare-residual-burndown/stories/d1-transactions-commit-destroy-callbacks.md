---
title: "D1 — transactions: committed/destroy callback firing"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "clusters"
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Reopens f4. committedBang fires for destroy (triggerDestroyCallback), callback ordering, and instrumentTransaction Notifications event not published.

Counted `test:compare` skips covered by this story: **34** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- committedBang fires for destroy (triggerDestroyCallback=true) and
- afterCommit/afterRollback scoped to savepoint level requires
- transactions.ts#instrumentTransaction or Notifications event not published on commit/rollback

### Skipped tests to un-skip

- `transactions_test.rb` → `transactions.test.ts` — **25** counted skips:
  - after_commit_returns_record_with_destroy
  - nested_transaction_with_savepoint_fires_callbacks
  - throw from transaction commits
  - rollback dirty changes even with raise during rollback removes from pool
  - rollback dirty changes even with raise during rollback doesnt commit transaction
  - connection removed from pool when commit raises and rollback raises
  - connection removed from pool when begin raises after successfully beginning a transaction
  - connection removed from pool when thread killed in begin after successfully beginning a transaction
  - rollback dirty changes then retry save on new record with autosave association
  - add to null transaction
  - deprecation on ruby timeout outside inner transaction
  - invalid keys for transaction
  - using named savepoints
  - releasing named savepoints
  - savepoints name
  - rollback when thread killed
  - sqlite add column in transaction
  - sqlite default transaction mode is immediate
  - mark transaction state as nil
  - transaction rollback with primarykeyless tables
  - unprepared statement materializes transaction
  - nested transactions skip excess savepoints
  - prepared statement materializes transaction
  - savepoint does not materialize transaction
  - raising does not materialize transaction
  - accessing raw connection materializes transaction
  - accessing raw connection disables lazy transactions
  - checking in connection reenables lazy transactions
  - automatic savepoint in outer transaction
  - no automatic savepoint for inner transaction
  - the uuid is lazily computed
  - transaction per thread
  - transaction isolation read committed
  - after current transaction commit multidb nested transactions
  - concurrent Promise.all top-level transactions are serialized (no shared TM frame)
- `transaction_callbacks_test.rb` → `transaction-callbacks.test.ts` — **7** counted skips:
  - only call after commit on update after transaction commits for existing record on touch
  - only call after commit on top level transactions
  - only call after rollback on update after transaction rollsback for existing record on touch
  - saving a record with a belongs to that specifies touching the parent should call callbacks on the parent object
  - before commit actions
  - updated callback called on first to save when followed in transaction by destroy from separate instance with old configuration
  - destroyed callbacks called on first saved instance in transaction with old configuration
- `transaction_instrumentation_test.rb` → `transaction-instrumentation.test.ts` — **2** counted skips:
  - reconnecting after materialized transaction starts new event
  - transaction instrumentation on failed rollback

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
