---
title: "Audit transaction-wrapping call-set omissions"
status: ready
updated: 2026-06-29
rfc: "0044-call-set-parity-fidelity-burndown"
cluster: real-omission
deps: ["call-mismatches-ratcheting-baseline"]
deps-rfc: []
est-loc: 100
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Four flagged pairs about transaction wrapping:
`associations/collection-association.ts` `concat` and `replace` (missing
`transaction`), `connection-adapters/sqlite3-adapter.ts` `alter_table`
(missing `transaction`), `migration.ts` `ddl_transaction` (missing
`transaction`). Rails wraps these bodies in a `transaction { ... }` block
(collection_association.rb, sqlite3 adapter, migration.rb). A missing wrap
means partial writes aren't rolled back atomically — a real correctness gap;
but the TS side may achieve atomicity through a different transaction helper.

## Acceptance criteria

- For each of the 4: compare the Rails body's transaction wrapping against the
  TS body.
- Real omissions converge (wrap in the equivalent TS transaction) with a test
  asserting rollback/atomicity where feasible (match Rails test names).
- Confirmed equivalents (atomicity via a different call) get a justified
  baseline entry.
- All 4 entries resolved in `call-mismatches.json`.
