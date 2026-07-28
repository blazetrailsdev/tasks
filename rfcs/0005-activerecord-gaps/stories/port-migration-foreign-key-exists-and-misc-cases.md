---
title: "Port the foreign_key_exists cluster and remaining ForeignKeyTest miscellany"
status: in-progress
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 5542
claim: "2026-07-28T22:45:44Z"
assignee: "port-migration-foreign-key-exists-and-misc-cases"
blocked-by: null
closed-reason: null
---

## Context

Remaining non-PostgreSQL-gated cases of
`ActiveRecord::Migration::ForeignKeyTest` after #5453 (file sits at 35/72):

- The `foreign_key_exists` cluster (`foreign_key_test.rb:336-391`):
  `test_foreign_key_exists`,
  `test_foreign_key_exists_referencing_table_having_keyword_as_name`,
  `test_foreign_key_exists_by_column`, `test_foreign_key_exists_by_name`
  (skips on SQLite3), `test_foreign_key_exists_in_change_table`, and
  `test_remove_constraint`.
- Miscellany (:621-823): `test_does_not_create_foreign_keys_when_bypassed_by_config`,
  `test_add_foreign_key_with_if_not_exists_not_set`,
  `test_add_foreign_key_with_if_not_exists_set`,
  `test_add_foreign_key_preserves_existing_column_types`.

Ten cases total. Setup is the shared `withRocketTables`
(`packages/activerecord/src/support/rocket-tables.ts`) already used by the
ported half, so no new schema is needed. The keyword-table case needs Rails'
`"references"` table, and `if_not_exists_not_set` branches per adapter on the
raised error (:775-802).

## Acceptance criteria

- [ ] All ten cases ported into
      `packages/activerecord/src/migration/foreign-key.test.ts`, names verbatim,
      inside the existing `ForeignKeyTest` describe.
- [ ] `skip if current_adapter?(:SQLite3Adapter)` and the per-adapter error
      branches are honored rather than dropped; `--gates --check` stays at 0.
- [ ] No bespoke tables; `withRocketTables` or the canonical schema only.
- [ ] `test:compare` delta for `foreign_key_test.rb` is strictly positive.
- [ ] Green on all three adapters.
