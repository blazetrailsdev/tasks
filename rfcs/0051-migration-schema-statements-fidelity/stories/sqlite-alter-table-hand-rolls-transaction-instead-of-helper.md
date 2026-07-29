---
title: "sqlite3: alterTable hand-rolls savepoint/BEGIN instead of Rails' transaction helper"
status: in-progress
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5621
claim: "2026-07-29T23:42:00Z"
assignee: "sqlite-alter-table-hand-rolls-transaction-instead-of-helper"
blocked-by: null
closed-reason: null
---

## Context

Rails' `alter_table` closes with
`transaction { disable_referential_integrity { move_table(...); move_table(...) } }`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:586-591`).

trails' `alterTable`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2420-2452`)
hand-rolls the transaction instead: it reads `this._inTransaction`, derives a
savepoint name from the bare table name, and calls `createSavepoint` /
`beginTransaction` + `releaseSavepoint` / `commitTransaction` directly, with a
`try`/`catch` rollback. Rails' `transaction` helper already picks savepoint vs
BEGIN for a nested call, so the branch is re-implementing machinery that exists.

`api:compare` records this as the one call mismatch for the method:
`alter_table -> alterTable, missing: ["transaction -> transaction"]`
(`scripts/api-compare/output/call-mismatches.json`).

Noticed while reordering `alterTable`'s parameters in PR #5607.

## Acceptance criteria

- [ ] `alterTable` wraps its body in the `transaction` helper rather than
      branching on `_inTransaction` to pick `createSavepoint` vs
      `beginTransaction`.
- [ ] The bespoke savepoint-name derivation and the `try`/`catch` rollback
      branch are deleted.
- [ ] The `alter_table -> alterTable` entry disappears from
      `output/call-mismatches.json`; api:compare / test:compare deltas
      non-negative.
- [ ] SQLite adapter suites, `migration/foreign-key.test.ts` and
      `adapters/sqlite3/copy-table.trails.test.ts` stay green, including the
      nested (inside-migration) path that motivated the savepoint branch.
