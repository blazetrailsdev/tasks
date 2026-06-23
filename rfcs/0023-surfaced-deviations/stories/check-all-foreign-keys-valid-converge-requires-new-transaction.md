---
title: "Converge checkAllForeignKeysValidBang to Rails transaction(requires_new:)"
status: claimed
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-06-23T11:17:40Z"
assignee: "check-all-foreign-keys-valid-converge-requires-new-transaction"
blocked-by: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/referential-integrity.ts`
`checkAllForeignKeysValidBang` hand-rolls the savepoint/begin/commit/rollback
control flow (branching on `inTransaction || isTransactionOpen()`, naming a
savepoint `active_record_${openTransactions + 1}`, etc.).

Rails (`postgresql/referential_integrity.rb` `check_all_foreign_keys_valid!`)
simply wraps the SQL in `transaction(requires_new: true) do execute(sql) end`,
delegating savepoint-vs-BEGIN selection to the transaction manager. The sibling
`disableReferentialIntegrity` in the same file already converges to the Rails
form via `this.transaction(fn, { requiresNew: true })`.

This deviation predates the extract-pg-referential-integrity code-motion PR
(#3908) — that PR moved the method verbatim without changing behavior.

## Acceptance criteria

- [ ] `checkAllForeignKeysValidBang` calls `this.transaction(async () => { await this.execute(CHECK_ALL_FOREIGN_KEYS_SQL); }, { requiresNew: true })`, dropping the bespoke savepoint bookkeeping.
- [ ] `ReferentialIntegrityHost` interface trimmed to only the members still used.
- [ ] No test edits beyond imports; CI green on all three adapters.
