---
title: "assertions-transactions-and-adapter-remainder"
status: ready
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
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

Remainder of `assertions-transactions-locking-and-pool` (RFC 0132). The PR for that story converged `transaction_callbacks_test.rb`, `transaction_isolation_test.rb`, `connection_pool_test.rb` and `locking_test.rb` to 0 assertion mismatches. Two Rails files remain, re-measured with `pnpm parity:test -- --package activerecord --assertions --missing` on that branch:

- `vendor/rails/activerecord/test/cases/transactions_test.rb` → `packages/activerecord/src/transactions.test.ts`: 14 assertion-count + 49 assertion-kind mismatches. Count rows: connection removed from pool when commit raises and rollback raises (5 vs 4), begin raises after successfully beginning (4 vs 3), break/return from transaction commits (4 vs 2), raising exception in callback rollbacks in save, rolling back in a callback rollbacks before save, callback rollback in create (6 vs 3), rollback when commit raises (4 vs 1), rollback when saving a frozen record, restore active record state for all records in a transaction (21 vs 16), restore composite id after rollback, sqlite add column in transaction, transaction after commit/rollback callback.
- `vendor/rails/activerecord/test/cases/adapter_test.rb` → `packages/activerecord/src/adapter.test.ts`: 8 count + 53 kind mismatches (create record with pk as zero, table exists?, data source exists?, not specifying database name for cross database selects, exceptions from notifications are not translated, database related exceptions are translated to statement invalid, disable referential integrity, create with query cache, plus the kind rows: predicates written as `toBe(true/false)` where Rails uses `assert_predicate`/`assert_not_predicate`, `rejects.toBeInstanceOf` where Rails uses `assert_raises`, `toBeDefined` where Rails uses `assert`).

Patterns that converged the sibling files: Rails `assert_predicate`/`assert` → `toBeTruthy()`, `assert_not_predicate` → `toBeFalsy()` (not `toBe(true/false)`); `assert_raises(K) { }` → `assertRaises([K], {}, fn)` from `@blazetrails/activesupport`; `assert_nothing_raised` → `assertNothingRaised`; `assert_empty` → `assertEmpty`. A bespoke per-test model (`class Topic extends Base`) shadowing an imported `Topic` gets renamed by esbuild to `Topic2` and reflects the wrong table — alias the import instead.

## Acceptance criteria

- Both files report 0 assertion-count and 0 assertion-kind mismatches; a converged assertion that fails on a production bug is parked `it.skip` with `// BLOCKED: <story>` and a filed story in RFC 0155.
- No test renames; the mark file stays frozen.
