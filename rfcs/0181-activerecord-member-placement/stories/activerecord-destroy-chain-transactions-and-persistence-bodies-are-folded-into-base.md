---
title: "activerecord: Transactions#destroy and Persistence#destroy are folded into persistence.ts destroy and Base#_destroyRow"
status: draft
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activerecord` reports
`activerecord/base.ts destroy inlined-from transactions.rb (destroy)`. The row was hidden behind
`base.ts destroy inlined-from callbacks.rb` (the report dedupes on `tsFile#tsName`) until
`activerecord-relocate-callbacks-bodies-inlined-in-base` moved `Callbacks#destroy` to `callbacks.ts`.

Rails' `destroy` is three bodies chained through `super`:

- `Transactions#destroy` — `with_transaction_returning_status { super }`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/transactions.rb:356-358`)
- `Callbacks#destroy` — the `@_destroy_callback_already_called` guard, `_run_destroy_callbacks { super }`,
  `rescue RecordNotDestroyed` (`vendor/rails/v8.0.2/activerecord/lib/active_record/callbacks.rb:419-429`)
- `Persistence#destroy` — `_raise_readonly_record_error if readonly?`, `destroy_associations`,
  `@_trigger_destroy_callback ||= persisted? && destroy_row > 0`, `@destroyed = true`,
  `@previously_new_record = false`, `freeze`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:453-460`)

trails has only the middle one at its Rails home (`packages/activerecord/src/callbacks.ts` `destroy`).
The other two are folded together and split across two files:

- `packages/activerecord/src/persistence.ts` `destroy` holds the readonly check and then
  `Transactions#destroy`'s `withTransactionReturningStatus` wrap, calling `self._destroyRow()`.
  `transactions.ts` has no `destroy`.
- `packages/activerecord/src/base.ts` `Base#_destroyRow` (a private method with no Rails name) holds
  `Persistence#destroy`'s body as the block it hands `Callbacks#destroy`, plus two things Rails has
  no counterpart for: `_preloadBelongsToForDestroyCallbacks()` before the callbacks, and the
  `_newRecordBeforeLastCommit = false` / `_triggerUpdateCallback = false` writes after them.

So the readonly check runs outside the transaction and the callbacks, where Rails raises
`ReadOnlyRecord` inside both.

## Acceptance criteria

- [ ] `transactions.ts` exports `destroy(this, superFn)` with Rails' one-line body, and
      `persistence.ts` `destroy` is Rails' `Persistence#destroy` body, line for line.
- [ ] `base.ts` wires the chain `Transactions.destroy -> Callbacks.destroy -> Persistence.destroy`
      the way it wires `touch`, and `Base#_destroyRow` is deleted.
- [ ] `_preloadBelongsToForDestroyCallbacks` and the two extra flag writes are either converged away or
      carry an `@inventedArm` receipt naming the language shortcoming.
- [ ] `pnpm parity:api:extra --package activerecord` no longer lists
      `base.ts destroy inlined-from transactions.rb`.
- [ ] `persistence.test.ts`, `callbacks.test.ts`, `transactions.test.ts`, `readonly.test.ts` and the
      association destroy test files are green on SQLite, PG and MySQL.
