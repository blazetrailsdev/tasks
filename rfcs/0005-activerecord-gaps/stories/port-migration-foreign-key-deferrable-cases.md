---
title: "Port the PG-only deferrable cases of ForeignKeyTest"
status: draft
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The PostgreSQL-only `deferrable` block of
`ActiveRecord::Migration::ForeignKeyTest`
(`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:525-619`,
guarded by `if supports_deferrable_constraints?`) is unported — 10 of the 37
cases `test:compare` still reports missing after #5453:

`test_add_invalid_foreign_key`, `test_deferrable_foreign_key`,
`test_not_deferrable_foreign_key`, `test_deferrable_initially_deferred_foreign_key`,
`test_deferrable_initially_immediate_foreign_key`,
`test_schema_dumping_with_defferable` (Rails' spelling — keep it verbatim),
`test_schema_dumping_with_disabled_defferable`,
`test_schema_dumping_with_defferable_initially_deferred`,
`test_schema_dumping_with_defferable_initially_immediate`,
`test_schema_dumping_with_special_chars_deferrable`.

The five dumping cases assert on the `deferrable:` option the dumper emits
(`packages/activerecord/src/schema-dumper.ts`, mirroring `schema_dumper.rb:338`)
via `dumpTableSchema`
(`packages/activerecord/src/support/schema-dumping-helper.ts`).

Check against [[converge-pg-dumper-deferrable-truthiness]] (0023, draft) before
starting — that story covers the truthiness of the same emitted option and may
change what these cases should assert.

Setup is the shared `withRocketTables`; no new schema needed.

## Acceptance criteria

- [ ] The ten cases are ported into
      `packages/activerecord/src/migration/foreign-key.test.ts`, names verbatim
      including Rails' `defferable` misspelling, behind the existing
      supports-gating helper.
- [ ] `--gates --check` stays at exit 0.
- [ ] Any overlap with [[converge-pg-dumper-deferrable-truthiness]] is resolved
      in one direction, not asserted both ways.
- [ ] `test:compare` delta for `foreign_key_test.rb` is strictly positive.
- [ ] Green on all three adapters.
