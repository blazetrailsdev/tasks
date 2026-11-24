---
title: "activerecord-transactions-attr-accessor-last-transaction-return-status"
status: ready
updated: 2026-11-24
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps:
  - activerecord-reaches-100
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --missing --package activerecord` (2026-11-24, after the
activerecord-reaches-100 PR) reports two members short, both from one Rails line:

- `vendor/rails/v8.0.5.2/activerecord/lib/active_record/transactions.rb:16`
  `attr_accessor :_new_record_before_last_commit, :_last_transaction_return_status # :nodoc:`
  - `_last_transaction_return_status` → `_lastTransactionReturnStatus` `[declaration-only]`
  - `_last_transaction_return_status=` → `_lastTransactionReturnStatus` `[declaration-only]`

trails today:

- `packages/activerecord/lib/base.ts:1802` declares `_lastTransactionReturnStatus?: unknown;`
  (bodyless, so the gate scores it declaration-only), and the constructor's
  `init_internals` segment assigns it `null` (`base.ts:1386`,
  Rails `transactions.rb:436`).
- `packages/activerecord/lib/transactions.ts:361` writes it
  (`with_transaction_returning_status`, `transactions.rb:420`), and
  `relation.ts:963,988` read it (`relation.rb:278,298`).
- Its sibling `_new_record_before_last_commit` is credited through a reader
  function in `transactions.ts:367` spliced onto `Base` (`base.ts:2291`), while the
  constructor also assigns an own field of the same name (`base.ts:1388`), so the
  own field shadows the prototype reader. Pick one `attr_accessor` shape for both.

## Acceptance criteria

- [ ] `attr_accessor :_new_record_before_last_commit, :_last_transaction_return_status`
      ports as one shape for both names, and the reader/writer pair is credited.
- [ ] `pnpm parity:api --missing --package activerecord` reports 0 missing for `base.rb`.
- [ ] No own field shadows a spliced prototype member of the same name.
