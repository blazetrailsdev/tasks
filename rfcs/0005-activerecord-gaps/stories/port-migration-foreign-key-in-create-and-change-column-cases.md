---
title: "Port ForeignKeyInCreateTest and ForeignKeyChangeColumnTest cases"
status: draft
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
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

These are 7 of the 37 cases `test:compare` still reports missing for the file
after #5453 (35/72 ported).

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
