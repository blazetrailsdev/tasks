---
title: "Port the remaining ActiveRecord::Migration::RenameTableTest cases"
status: done
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5574
claim: "2026-07-29T16:45:44Z"
assignee: "port-migration-rename-table-cases"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/migration/rename-table.test.ts` was created by
PR #5547 to give the relocated `rename table` case its Rails-matching home.
It holds only that one; `parity:test` reports **5 missing** for
`vendor/rails/activerecord/test/cases/migration/rename_table_test.rb`.

The file already carries the setup/teardown from `rename_table_test.rb:12-22`
(add `url`, remove `created_at`/`updated_at`, rename `octopi` back).
Remaining cases: `test_rename_table_should_work_with_reserved_words` (:24-38,
renames the canonical `references` table and must restore it),
`test_rename_table_raises_for_long_table_names` (:51+), plus the index/
sequence-preservation arms.

`test_rename_table_should_work_with_reserved_words` touches the canonical
`references` table on the shared per-worker database, so its restore path
needs care — see `support/canonical-table-rebuild.ts` for the pattern the
constraint tests use.

## Acceptance criteria

- [ ] The remaining `rename_table_test.rb` cases are ported under
      `Migration > RenameTableTest` with names matching Rails verbatim.
- [ ] `parity:test` missing count for `migration/rename_table_test.rb` drops
      to 0; 0 gate-mismatch, 0 misplaced.
- [ ] Green on all three lanes; the shared-DB `references` rename leaves the
      canonical schema intact for files that run next.
