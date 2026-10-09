---
title: "activerecord: DatabaseStatements#transaction takes Rails' body and drops the ar_current_transaction scope"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8721
claim: "2026-10-09T18:39:41Z"
assignee: "attribute-methods-class-attribute-names-memo-and-cold-cache-arms"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-1`.

Rails' `DatabaseStatements#transaction`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:352-363`)
is one `if` / `else`, one nested `if isolation` raise, and a `rescue ActiveRecord::Rollback`. It yields
`current_transaction.user_transaction` or hands the block to `within_new_transaction`.

trails' `transaction` (`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:383`)
wraps the block in a local `fn` that normalises the yielded value to an internal `Transaction`, installs
it under `CURRENT_TRANSACTION_KEY` in `IsolatedExecutionState`, and restores the previous value when the
block's promise settles. `pnpm parity:api:arms:report --package=activerecord --direction=invented` reports
`+if +if +if +try +if +if +throw +rescue` for the pair.

The scope was put there by `converge-current-transaction-scope-onto-connection` (trails#7014), so that
`connection.transaction` alone feeds `currentTransaction()` in `packages/activerecord/src/transactions.ts:33`,
which `addToTransaction` (`transactions.ts:397`) and `rememberTransactionRecordState` (`transactions.ts:231`)
read. Rails has no such scope: `add_to_transaction`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/transactions.rb:512-516`) is
`self.class.with_connection { |connection| connection.add_transaction_record(self, ensure_finalize) }`, and
`remember_transaction_record_state` (`transactions.rb:440-459`) reads only the record's own ivars. The
connection's own `current_transaction` is the only carrier.

## Acceptance criteria

- [ ] `transactions.ts`'s `currentTransaction()` readers reach the transaction through the connection, as
      `transactions.rb` does, and `CURRENT_TRANSACTION_KEY` is deleted.
- [ ] `DatabaseStatements#transaction` has Rails' body: no `fn` wrapper, the `rescue ActiveRecord::Rollback`
      written as an `instanceof` catch arm.
- [ ] The invented-direction arms report has no `database-statements.ts#transaction` row.
- [ ] The transaction suites pass on every adapter lane.
