---
title: "port-migration-references-foreign-key-naming-and-conditional-cases"
status: done
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5488
claim: "2026-07-28T02:10:16Z"
assignee: "port-migration-references-foreign-key-naming-and-conditional-cases"
blocked-by: null
closed-reason: null
---

## Context

Five cases of `ActiveRecord::Migration::ReferencesForeignKeyTest`
(`vendor/rails/activerecord/test/cases/migration/references_foreign_key_test.rb`)
were deliberately left unported by the
`port-migration-references-foreign-key-cases` PR because each needs an
implementation gap closed first:

- `foreign key methods respect pluralize_table_names` (rb:187-205) —
  `SchemaStatements#addReference` / `#removeReference`
  (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:698`
  and `:754`) hardcode `pluralize(refName)` for the FK's target table. Rails'
  `ReferenceDefinition#foreign_table_name`
  (`abstract/schema_definitions.rb:297-301`) and `remove_reference`
  (`abstract/schema_statements.rb:1086`) both consult
  `Base.pluralize_table_names` first. Same for
  `ReferenceDefinition` in `abstract/schema-definitions.ts`.
- `remove_reference responds to if_exists option` (rb:207-213) and
  `add_reference responds to if_not_exists option` (rb:215-223) — Rails threads
  `options.slice(:if_exists, :if_not_exists)` into the FK, index, and column
  calls (`ReferenceDefinition#conditional_options`,
  `schema_statements.rb:1083`). trails' `addReference`/`removeReference` accept
  no such options and `Table#references` actively rejects them via
  `raiseOnIfExistOptions`.
- `test_references_foreign_key_with_prefix` (rb:225-244) and
  `test_references_foreign_key_with_suffix` — need
  `ActiveRecord::Base.table_name_prefix` / `table_name_suffix` to flow through a
  migration's `create_table` + `t.references ..., foreign_key: true` (Rails'
  `CreateDogsMigration` fixture, defined inline in the Ruby class).

`packages/activerecord/src/migration/references-foreign-key.test.ts` already
exists with the `Migration > ReferencesForeignKeyTest` describe path and a
`withTestingTables` helper — add these cases to it.

## Acceptance criteria

- [ ] `addReference`/`removeReference`/`ReferenceDefinition` derive the FK's
      target table via `Base.pluralizeTableNames`, matching
      `ReferenceDefinition#foreign_table_name`.
- [ ] `ifExists` / `ifNotExists` thread through reference FK, index, and column
      calls, matching `conditional_options`.
- [ ] `table_name_prefix` / `table_name_suffix` cases pass through a real
      migration.
- [ ] All five test names match Rails verbatim, under
      `Migration > ReferencesForeignKeyTest`.
- [ ] `pnpm test:compare --package activerecord --gates --check` exits 0.
