---
title: "Unprepared SELECT materializes the lazy transaction on PG/MySQL"
status: done
updated: 2026-07-07
rfc: "0057-transaction-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 45
pr: 4733
claim: "2026-07-07T12:49:50Z"
assignee: "unprepared-statement-materializes-lazy-transaction-pg-mysql"
blocked-by: null
---

## Context

Surfaced converting `transactions.test.ts` (RFC 0019 `transactions-test-canonical`,
PR #4194). Rails runs `unprepared statement materializes transaction` on every
adapter and expects `Topic.transaction { Topic.where("1=1").first }` to emit
`BEGIN|COMMIT` (`vendor/rails/activerecord/test/cases/transactions_test.rb:1485`).
On sqlite trails materializes and passes, but on PG/MySQL trails does not
materialize the pending lazy transaction for a no-bind unprepared SELECT, so no
`BEGIN` is emitted. Distinct from the (done) statement-cache pooling work in
`thread-collector-preparable-for-statement-cache` — this is about lazy-transaction
materialization on an unprepared read. Test is currently an unconditional
`it.skip` faithful port in `transactions.test.ts`.

## Acceptance criteria

- [ ] A no-bind unprepared SELECT inside an open lazy transaction materializes the
      transaction (emits BEGIN) on PG and MySQL, matching sqlite and Rails.
- [ ] Un-skip `unprepared statement materializes transaction`; passes on all adapters.
