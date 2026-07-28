---
title: "Port the PG-only validate cases of ForeignKeyTest"
status: ready
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

The PostgreSQL-only `validate` block of
`ActiveRecord::Migration::ForeignKeyTest`
(`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:453-523`,
guarded by `if supports_validate_constraints?`) is unported — 9 of the 37 cases
`test:compare` still reports missing after #5453:

`test_add_invalid_foreign_key`, `test_validate_foreign_key_infers_column`,
`test_validate_foreign_key_by_column`, `test_validate_foreign_key_by_symbol_column`,
`test_validate_foreign_key_by_name`, `test_validate_foreign_non_existing_foreign_key_raises`,
`test_validate_constraint_by_name`, `test_schema_dumping_with_validate_false`,
`test_schema_dumping_with_validate_true`.

The two dumping cases assert on `add_foreign_key … validate: false`, which the
dumper already emits (`packages/activerecord/src/schema-dumper.ts`, the
`fk.validate === false` arm, mirroring `schema_dumper.rb:339`), so they are
mostly a check on `validate:` surviving introspection. `SchemaDumpingHelper` is
available as `dumpTableSchema`
(`packages/activerecord/src/support/schema-dumping-helper.ts`), already used by
the file.

Setup is the shared `withRocketTables`; no new schema needed.

## Acceptance criteria

- [ ] The nine cases are ported into
      `packages/activerecord/src/migration/foreign-key.test.ts`, names verbatim,
      behind the existing supports-gating helper so non-PG adapters skip the way
      Rails' `if supports_validate_constraints?` does.
- [ ] `--gates --check` stays at exit 0 (the gate must read as a feature gate,
      not an adapter list).
- [ ] `test:compare` delta for `foreign_key_test.rb` is strictly positive.
- [ ] Green on all three adapters.
