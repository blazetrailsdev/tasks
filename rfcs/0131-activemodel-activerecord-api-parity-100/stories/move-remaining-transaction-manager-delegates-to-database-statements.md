---
title: "Move the seven remaining transaction_manager delegates from abstract-adapter.ts into their Rails file"
status: draft
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails declares ten transaction-manager delegates in ONE place — the
`delegate ... to: :transaction_manager` at
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:367-370`:

```ruby
delegate :within_new_transaction, :open_transactions, :current_transaction, :begin_transaction,
         :commit_transaction, :rollback_transaction, :materialize_transactions,
         :disable_lazy_transactions!, :enable_lazy_transactions!, :dirty_current_transaction,
         to: :transaction_manager
```

PR #7430 moved three of them (`within_new_transaction`, `current_transaction`,
`dirty_current_transaction`) into
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`,
which is the file that Ruby line lives in. The other seven are still
hand-written class members on `AbstractAdapter`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1315-1341`
on `origin/main` at e64561838), so `parity:api` reports each of them as a
`move` — matched, but attributed to `connection-adapters/abstract-adapter.ts`
when Rails puts them in `abstract/database_statements.rb`.

The seven, with their current homes:

| Ruby name                  | TS name                      | currently at        |
| -------------------------- | ---------------------------- | ------------------- |
| `open_transactions`        | `openTransactions` (getter)  | abstract-adapter.ts |
| `begin_transaction`        | `beginTransaction`           | abstract-adapter.ts |
| `commit_transaction`       | `commitTransaction`          | abstract-adapter.ts |
| `rollback_transaction`     | `rollbackTransaction`        | abstract-adapter.ts |
| `materialize_transactions` | `materializeTransactions`    | abstract-adapter.ts |
| `disable_lazy_transactions!` | `disableLazyTransactionsBang` | abstract-adapter.ts |
| `enable_lazy_transactions!`  | `enableLazyTransactionsBang`  | abstract-adapter.ts |

`parity:api:moves` only reports; nothing gates a cross-file relocation, and
`rails-file-structure-method-order` orders members WITHIN a file and cannot see
this, so these sit unflagged.

While in the file, one related divergence: `AbstractAdapter#isTransactionOpen`
(`abstract-adapter.ts:1323`) reads `this._transactionManager.currentTransaction.open`
directly, where Rails' `transaction_open?` (`database_statements.rb:379-381`)
is `current_transaction.open?` — it goes through the delegate. Route it through
`this.currentTransaction()` so an adapter overriding the delegate is honoured.

## Converged shape

Each becomes an exported `this`-typed free function in
`abstract/database-statements.ts`, added to the `DatabaseStatements` mixin
object, with the `AbstractAdapter` class member deleted and its signature
declared on the `AbstractAdapter` interface instead — exactly the shape #7430
used for the first three:

```ts
export function openTransactions(this: DatabaseStatementsHost): number {
  return transactionManager.call(this)!.openTransactions;
}
```

Note `open_transactions` is a Ruby method, so trails' getter (`get
openTransactions()`) should become a plain member on the mixin; check the
handful of `.openTransactions` read sites before flipping it, since a getter
and a method are not interchangeable at the call site.

`include()` skips a key the class already owns
(`packages/ruby-compat/src/include.ts:448`), so the class members MUST be
deleted, not merely shadowed — leaving them in place makes the mixin version
dead code and the move a no-op for `parity:api`.

## Acceptance criteria

- All seven live in `abstract/database-statements.ts` and are gone from the
  `AbstractAdapter` class body; the `AbstractAdapter` interface declares them.
- `AbstractAdapter#isTransactionOpen` reads through `this.currentTransaction()`.
- `parity:api --package activerecord` shows zero `moves` rows attributing a
  `database_statements.rb` member to `abstract-adapter.ts`; overall delta
  non-negative.
- `pnpm parity:api:calls`, `:calls:args`, `:params`, `parity:api:extra:gate` clean.
- All five adapter lanes pass.
