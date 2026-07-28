---
title: "test: port columns_test.rb's rename/remove-column index cases"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/migration/columns_test.rb` has no trails
counterpart (`migration/columns.test.ts` exists but `test:compare` reports 33
missing of 36). The rename/remove-column index cases are the ones that pin the
behaviour PR #5529 converged:

- `test_rename_column_with_an_index` (:96-104)
- `test_rename_column_with_multi_column_index` (:106-116)
- `test_rename_column_does_not_rename_custom_named_index` (:118-125)
- `test_remove_column_with_index` (:127-134)
- `test_remove_column_with_multi_column_index` (:136-155)

Because the file is unported, PR #5529's regressions for
`renameColumn`-renames-the-index and `removeColumn`-keeps-the-surviving-columns
had to go in the trails-only `connection-adapters/sqlite3-copy-table.test.ts`
instead of the Rails-matched file. Porting the cluster lets those move to their
canonical home and closes the `test:compare` gap.

Rails drives these through the `TestModel` / `test_models` table that
columns_test.rb sets up in `setup`; check
`packages/activerecord/src/test-helpers/test-schema.ts` for the canonical
equivalent before adding anything.

## Acceptance criteria

- [ ] The five rename/remove-column index cases above are ported to
      `migration/columns.test.ts` with Rails-verbatim test names, including the
      MariaDB skip on `test_remove_column_with_multi_column_index` and the
      PostgreSQL-vs-others branch on its assertion.
- [ ] The two overlapping regressions in `sqlite3-copy-table.test.ts`
      (`renameColumn renames the index whose name embeds the column`,
      `removeColumn keeps a multi-column index on the surviving columns`) are
      removed once the ported cases cover them.
- [ ] Green on all three adapters; `test:compare` shows the ported cases matched.
