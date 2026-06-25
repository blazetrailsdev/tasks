---
title: "Relocate misplaced call-after-commit test to the transaction_callbacks convention file"
status: ready
updated: 2026-06-25
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/transactions.test.ts` still carries one MOVE-class
extra test after the transactions-extra-burndown (PR #4131): the `it("call
after commit after transaction commits")` inside the bespoke `Account` /
`describe("TransactionTest")` block (transactions.test.ts ~line 1822). Its
name matches `test_call_after_commit_after_transaction_commits` in
`vendor/rails/activerecord/test/cases/transaction_callbacks_test.rb:113`, not
`transactions_test.rb` — so `test:compare` counts it as `extra` for the
transactions convention file. It was deliberately left in place during the
burndown per RFC 0043's MOVE triage (exists in Rails elsewhere → out of scope
for delete/relocate).

The implementation is also bespoke (a local `Account` model on a non-canonical
`accounts: { name, balance }` table), so the move should converge it to the
canonical model/table used by the transaction-callbacks convention file.

## Acceptance criteria

- Move `call after commit after transaction commits` from
  `transactions.test.ts` into the TS convention file that maps to
  `transaction_callbacks_test.rb`, matching the Rails test name verbatim.
- Converge it to the canonical model/table (no bespoke `accounts` shape).
- After the move, `transactions.test.ts` `extra` drops by 1 (74→8 was the
  burndown result; this takes it toward the 7 documented permanent-skips that
  remain). `matched`/`missing`/`wrongDescribe`/`misplaced` unchanged for both
  files; the callbacks file's `matched` should account for the moved test.
- The remaining bespoke `describe("TransactionTest")` Account scaffolding in
  transactions.test.ts can be dropped once the test leaves.
