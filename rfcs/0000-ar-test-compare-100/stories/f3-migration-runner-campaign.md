---
title: "F-3 — migration runner campaign"
status: done
updated: 2026-06-07
rfc: "0000-ar-test-compare-100"
cluster: clusters
deps: []
deps-rfc: []
est-loc: 200
pr: 3008
claim: "2026-06-07T22:28:41Z"
assignee: "f3-migration-runner-campaign"
blocked-by: null
---

## Context

Batch 1 shipped #2869 (3). 23 remaining. **Next: CopyMigrationsTest (5)** —
`Migration.copy` already implemented; follow `MigrationProperTableNameAndCopy`
tmp-dir pattern; magic-comments case needs magic-comment-aware prepend.
**invertible-migration CommandRecorder (4):** revert `change_column_default`
(`:170`), table-name prefix (`:321`), add-index-on-expression (`:367`),
add-check-constraint invalid option (`:417`).

## Acceptance criteria

- [ ] `CopyMigrationsTest` (5) un-skipped.
- [ ] `invertible_migration_test.rb` CommandRecorder cases (4) un-skipped.
- [ ] All remaining migration-runner skips → 0.

## Notes

Ours: `migration.test.ts:2659,2666,2682,2689,2696`,
`invertible-migration.test.ts:170,321,367,417`.
Rails: `test/cases/migration_test.rb`, `invertible_migration_test.rb`.
Natural split: CopyMigrations vs. CommandRecorder inversion.
