---
title: "Fix re-entrant savepoint materialization (mutual autosave cycle) + un-skip Eye/Iris twice tests"
status: claimed
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 20
pr: null
claim: "2026-06-13T14:55:14Z"
assignee: "savepoint-materialize-reentrancy"
blocked-by: null
---

## Context

Surfaced by PR #3152 (f9-autosave-association). When two records form a mutual
autosave pair — `has_one` (autosave) on one side, `belongs_to` (autosave) on the
other, with the inverse inferred automatically (no explicit `foreignKey`) —
saving the belongs_to child cascades into saving its new parent, whose `has_one`
autosave re-enters the save for the original child. This is the exact shape of
the Rails `Eye` / `Iris` fixtures (`activerecord/test/models/eye.rb:14`, `:61`),
which declare `has_one :iris` / `belongs_to :eye` with no `:foreign_key`, so the
inverse IS inferred. Rails terminates the cascade via `changed_for_autosave?`
guards.

The autosave logic terminates correctly in trails too, but the cascade
re-enters `TransactionManager.materializeTransactions` while a savepoint is
mid-materialize. `SavepointTransaction.materializeBang`
(`packages/activerecord/src/connection-adapters/abstract/transaction.ts:728`)
issues `await connection.createSavepoint(...)` **before** `super.materializeBang()`
sets `_materialized = true`. During that await, the re-entrant
`materializeTransactions` pass sees the same transaction still
`!isMaterialized()` and calls `materializeBang` again, double-starting the
instrumenter → `InstrumentationAlreadyStartedError`. SQLite's instrumenter
tolerated the double-start; PostgreSQL's raises.

Our `materializeTransactions` already has Rails' re-entrancy guard
(`return if @materializing_transactions`, transaction.rb:578) but implemented via
AsyncContext-owner matching rather than a plain boolean; that owner match fails
to fire across the cross-record cascade, so the guard does not protect the
nested pass.

PR #3152 worked around this by un-skipping the two callback-counter tests with
an explicit `foreignKey` on the Eye/Iris models (which suppresses automatic
inverse inference, matching Rails `reflection.rb` `can_find_inverse_of_automatically?`,
where `options[:foreign_key]` present disables inference). Review rejected that
as a non-Rails association shape, so both tests were reverted to `it.skip`
(`autosave-association.test.ts` `callbacks on child when parent autosaves child
twice` :324 and `callbacks on child when child autosaves parent twice` :355).

## Acceptance criteria

- [ ] Mutual autosave cascade (has_one autosave + belongs_to autosave with
      inferred inverse) no longer double-starts the savepoint instrumenter on
      PostgreSQL. Set `_materialized` / guard re-entrancy before the awaited
      `createSavepoint` in `SavepointTransaction.materializeBang`, or repair the
      AsyncContext-owner match so the nested `materializeTransactions` pass
      no-ops — mirroring Rails `materialize_transactions` (`return if
@materializing_transactions`) / `materialize!` ordering.
- [ ] Restore the Eye/Iris models in `autosave-association.test.ts` to the Rails
      fixture shape (no explicit `foreignKey`, inferred inverse) and un-skip
      `callbacks on child when parent autosaves child twice` and `callbacks on
child when child autosaves parent twice`. Confirm green on
      sqlite + postgres + mysql.
- [ ] No regressions in the transaction / savepoint suites (verify the
      AsyncContext-owner design's concurrent foreign-chain scenarios still hold).
