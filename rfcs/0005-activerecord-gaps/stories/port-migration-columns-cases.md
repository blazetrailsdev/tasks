---
title: "Port the remaining ActiveRecord::Migration::ColumnsTest cases"
status: done
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 5560
claim: "2026-07-29T01:45:44Z"
assignee: "port-migration-columns-cases"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/migration/columns.test.ts` was created by PR #5547 to
give the two relocated cases (`rename column`, `change column`) their
Rails-matching home. It holds only those two; `parity:test` reports **33
missing** for `vendor/rails/activerecord/test/cases/migration/columns_test.rb`.

The file already carries the scaffolding the rest needs: a `TestModel` on
`test_models` mirroring `Migration::TestHelper::TestModel`
(`vendor/rails/activerecord/test/cases/migration/helper.rb:16-18`), and a
`beforeEach`/`afterEach` mirroring that helper's setup/teardown (`helper.rb:20-34`).
Remaining cases include `test_add_rename` (`columns_test.rb:14-27`),
`test_rename_column_using_symbol_arguments` (:31-40),
`test_rename_column_preserves_default_value_not_null` (:53+), and the
`change_column` / `remove_column` families.

Rails sets `self.use_transactional_tests = false` on `ColumnsTest`
(`columns_test.rb:10`).

## Acceptance criteria

- [ ] The remaining `columns_test.rb` cases are ported under
      `Migration > ColumnsTest` with names matching Rails verbatim.
- [ ] `parity:test` missing count for `migration/columns_test.rb` drops
      accordingly; 0 gate-mismatch, 0 misplaced.
- [ ] Green on all three lanes (the cases are unconditional in Rails, so they
      must not be adapter-gated).
- [ ] Split across PRs under the 500-LOC ceiling if needed; register the
      remainder as sibling stories rather than fanning out PRs.
