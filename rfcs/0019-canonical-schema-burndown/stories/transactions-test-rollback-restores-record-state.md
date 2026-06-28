---
title: "transactions-test-rollback-restores-record-state"
status: done
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: null
deps:
  - transactions-test-canonical
deps-rfc: []
est-loc: null
priority: 81
pr: 4218
claim: "2026-06-27T16:46:34Z"
assignee: "transactions-test-rollback-restores-record-state"
blocked-by: null
---

## Context

Surfaced while converging `packages/activerecord/src/transactions.test.ts` onto
the canonical schema (RFC 0019 story `transactions-test-canonical`). Porting the
Rails bodies word-for-word against canonical `Topic`/`Movie`/`Cpk::Book` exposed
a transaction-semantics gap: saving a record **inside an already-open
transaction** prematurely finalizes that record's per-record transaction state
(`_startTransactionState`), so an **outer** rollback no longer restores the
pre-save snapshot.

Concretely, these faithful Rails ports are currently `it.skip` (marked
`CONVERGENCE-PENDING` in the file) because trails diverges:

- `rollback dirty changes` — `topic.changes["title"]` is empty after rollback
  (Rails keeps the unsaved dirty diff visible).
- `rollback dirty changes multiple saves`
- `rollback dirty changes then retry save`
- `restore frozen state after double destroy` — reply stays frozen after rollback.
- `restore new record after double save` — `id` not restored to nil.
- `restore previously new record after double save` — `previously_new_record?`
  false after rollback.
- `rolling back in a callback rollbacks before save` — a `Rollback` raised in
  `before_save` is swallowed by the save's own implicit transaction (surfaces as
  `RecordNotSaved`) instead of propagating to the outer transaction.

Single-save variants (`restore id after rollback`, `read/write attribute after
rollback`, etc.) already pass — the gap is specific to a second save/destroy (or
a save) occurring within an open outer transaction.

trails: `packages/activerecord/src/transactions.ts`
(`rememberTransactionRecordState` / `_restoreTransactionRecordState`,
`committedBang`/savepoint-commit path).
Rails: `vendor/rails/activerecord/lib/active_record/transactions.rb`
(`remember_transaction_record_state` / `restore_transaction_record_state`).

## Acceptance criteria

- [ ] Saving/destroying a record inside an already-open (non-`requires_new`)
      transaction does not finalize its `_startTransactionState`; the outer
      rollback restores the pre-transaction snapshot (dirty changes, `new_record?`,
      `frozen?`, `id`, `previously_new_record?`).
- [ ] A `Rollback` raised in a `before_save` callback propagates to the
      enclosing transaction rather than being converted to `RecordNotSaved`.
- [ ] Un-skip the 7 `CONVERGENCE-PENDING` tests in `transactions.test.ts`; they
      pass on sqlite + PG with no body changes (names unchanged).
