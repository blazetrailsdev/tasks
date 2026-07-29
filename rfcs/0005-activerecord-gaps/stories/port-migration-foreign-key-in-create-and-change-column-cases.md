---
title: "Port ForeignKeyInCreateTest and ForeignKeyChangeColumnTest cases"
status: done
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 5543
claim: "2026-07-28T22:55:44Z"
assignee: "port-migration-foreign-key-in-create-and-change-column-cases"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb` opens with
two classes that are entirely unported, plus their prefix/suffix subclasses:

- `ForeignKeyInCreateTest` (:9-21) — `test_foreign_keys`.
- `ForeignKeyChangeColumnTest` (:23-143) — `test_change_column_of_parent_table`,
  `test_rename_column_of_child_table`, `test_rename_reference_column_of_child_table`,
  `test_remove_reference_column_of_child_table`, `test_remove_foreign_key_by_column`,
  `test_remove_foreign_key_by_column_in_change_table`.
- `ForeignKeyChangeColumnWithPrefixTest` (:145-153) and
  `ForeignKeyChangeColumnWithSuffixTest` (:155-163) — subclasses that re-run the
  whole `ForeignKeyChangeColumnTest` body under a table-name prefix/suffix.

These were 7 of the 37 cases `test:compare` reported missing for the file
after #5453 (35/72 ported).

**Triage update 2026-07-28:** the file is now 56/72 with 16 missing, and 2 of
this story's 7 cases have since landed —
`test_rename_column_of_child_table` and
`test_rename_reference_column_of_child_table` are ported. The 6 still missing
are: `foreign keys` (×2, `ForeignKeyInCreateTest` + a prefix/suffix rerun),
`change column of parent table`, `remove reference column of child table`,
`remove foreign key by column`, `remove foreign key by column in change table`.
Re-run `pnpm test:compare --package activerecord --missing` before starting.

`ForeignKeyChangeColumnTest` carries its own `Rocket`/`Astronaut` models and a
`CreateRocketsMigration`, distinct from the `withRocketTables` helper the rest
of the file uses (`packages/activerecord/src/support/rocket-tables.ts`), plus a
`supports_rename_index?` guard on the MySQL family (:96).

The prefix/suffix subclasses exercise the machinery #5453 wired up
(`Base.tableNamePrefix` reaching the adapter layer via the `table-name-options`
registry) and should be checked against
[[strip-table-name-prefix-suffix-regex-escaping]].

## Acceptance criteria

- [ ] The two classes are ported into
      `packages/activerecord/src/migration/foreign-key.test.ts`, test names
      matching Rails verbatim, nested under the existing `Migration` describe as
      sibling describes to `ForeignKeyTest` / `CompositeForeignKeyTest`.
- [ ] The subclass-based prefix/suffix reruns are expressed without duplicating
      the case bodies.
- [ ] Rails' adapter/feature guards are honored, not dropped; `--gates --check`
      stays at exit 0.
- [ ] `test:compare` delta for `foreign_key_test.rb` is strictly positive.
- [ ] Green on all three adapters.
