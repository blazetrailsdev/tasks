---
title: "activerecord: six adapters/postgresql .trails test files build bespoke tables with raw SQL"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 86
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8826 moved 34 TS-only tests out of eight Rails-named
`packages/activerecord/src/adapters/postgresql/*.test.ts` files into `.trails.test.ts` siblings,
unchanged. Its reviewer noted that the moved tests build bespoke tables with raw
`CREATE TABLE` / `DROP TABLE` where the root CLAUDE.md rule "Canonical tables only — no bespoke
tables" asks for the canonical schema through `fixtures({ ... })`. None of these tables is in
`vendor/rails/v8.0.2/activerecord/test/schema/schema.rb` or
`vendor/rails/v8.0.2/activerecord/test/schema/postgresql_specific_schema.rb`, and none of the tests
has a Rails counterpart.

The tables, by file:

- `change-schema.trails.test.ts`: `strings`. The Rails-named `change-schema.test.ts` builds the same
  table, as `change_schema_test.rb:8-20` does with `create_table(:strings)`, so only the raw-SQL
  form differs there.
- `rename-table.trails.test.ts`: `before_rename`, `after_rename`. `rename_table_test.rb:6-14` builds
  `before_rename` with `create_table`.
- `full-text.trails.test.ts`: `tsvectors`. `full_text_test.rb:9-15` builds it with `create_table`.
- `integer.trails.test.ts`: `pg_int_types`, `bigint_rt`. Neither is a Rails table. The canonical
  `postgresql_specific_schema.rb` has `postgresql_types` / `bigint_array`-style tables to check
  first.
- `timestamp.trails.test.ts`: `postgresql_timestamps`. Not a Rails table; `timestamp_test.rb` uses
  `postgresql_timestamp_with_zones` and `topics`.
- `utils.trails.test.ts`: `utils_reset_pk`, `utils_reset_pk_custom`. Not Rails tables.

## Acceptance criteria

- [ ] Each test either reads a canonical table (schema.rb or postgresql_specific_schema.rb mirror) through `fixtures({ ... })`, or builds the table the Rails test file builds, with `createTable` and the Rails table name.
- [ ] A test that only repeats what a ported Rails test in the sibling file asserts is deleted.
- [ ] No table name in these six files is one neither Rails schema file nor the Rails test file names.
