---
title: "materializeTransactions re-entrancy guard (AsyncContext owner-match) diverges from Rails @materializing_transactions"
status: draft
updated: 2026-06-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by PR #3198 (savepoint-materialize-reentrancy).

Rails `TransactionManager#materialize_transactions`
(`activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:577`)
guards re-entrancy with a plain boolean held under `@connection.lock`:
`return if @materializing_transactions`. The boolean is set true around the
`@stack.each { |t| t.materialize! unless t.materialized? }` loop, so any
re-entrant `materialize_transactions` call (e.g. from queries issued during a
nested `materialize!`) no-ops immediately.

Our async port
(`packages/activerecord/src/connection-adapters/abstract/transaction.ts:986`)
translates that guard to AsyncContext **owner-matching** (a per-pass symbol
stored in both `_currentMaterializingOwner` and the AsyncContext store) rather
than a plain boolean — deliberately, to keep foreign concurrent chains from
being suppressed (a plain instance boolean would be true while awaiting and
would wrongly no-op a foreign chain's own materialization). But the owner match
**fails to fire across a cross-record autosave cascade**: the re-entrant
`materializeTransactions` call surfaces with a store that does not match
`_currentMaterializingOwner`, so the guard does not protect the nested pass.

PR #3198 worked around this **at the savepoint level** — `SavepointTransaction.materializeBang`
now early-flips `_materialized = true` before the awaited `createSavepoint` so
the nested pass skips the transaction via `!isMaterialized()`. That fixes the
observed `InstrumentationAlreadyStartedError` (PG) but leaves the guard itself
diverging from Rails: the structural re-entrancy protection still does not
mirror `@materializing_transactions` for the cross-record cascade case. A
future bug of the same shape (a re-entrant pass that is NOT gated by a
per-transaction `materialized?` flag) would not be caught.

Worth investigating: why the owner-match store fails to propagate across the
cascade (AsyncContext adapter swap? a detached/re-entered context boundary in
the autosave save path?), and whether the guard can be repaired to no-op the
nested pass directly — mirroring `return if @materializing_transactions` —
WITHOUT reintroducing the foreign-chain suppression the owner-match design
exists to prevent. Acceptance criterion 3 of the parent story (concurrent
foreign-chain scenarios must still hold) is the regression bar.

## Acceptance criteria

- [ ] Root-cause why the AsyncContext owner-match in `materializeTransactions`
      does not fire across the cross-record autosave cascade.
- [ ] Repair the guard so a re-entrant `materializeTransactions` pass triggered
      by the cascade no-ops directly (mirroring Rails
      `return if @materializing_transactions`), without suppressing foreign
      concurrent chains.
- [ ] Verify the PR #3198 savepoint-level early-flip workaround is still
      correct (or can be simplified) once the guard is repaired.
- [ ] No regressions in transaction / savepoint suites, including the
      concurrent foreign-chain scenarios the owner-match design protects.
