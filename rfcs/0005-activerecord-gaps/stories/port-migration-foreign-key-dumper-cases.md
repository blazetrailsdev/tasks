---
title: "port-migration-foreign-key-dumper-cases"
status: done
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5453
claim: "2026-07-27T20:29:51Z"
assignee: "port-migration-foreign-key-dumper-cases"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/migration/foreign-key.test.ts` now ports the
`add_foreign_key` and `remove_foreign_key` halves of
`ActiveRecord::Migration::ForeignKeyTest`
(`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:169-823`).

Still unported from that same Rails class are the `SchemaDumpingHelper`-driven
cases — the ones that call `dump_table_schema "astronauts"` and assert on the
emitted `add_foreign_key` lines, plus the migration-driven
`CreateCitiesAndHousesMigration` / `CreateSchoolsAndClassesMigration` cases at
`foreign_key_test.rb:676-747` and the table-name prefix/suffix variants.

They were deliberately left out of the remove-cases PR to stay under the 500-LOC
ceiling; they also need a `SchemaDumpingHelper` analogue (`dumpTableSchema`) that
the FK test file does not currently use.

The existing shared setup is `withRocketTables` in
`packages/activerecord/src/support/rocket-tables.ts` — reuse it, do not create a
bespoke schema.

## Acceptance criteria

- [ ] The `SchemaDumpingHelper`-driven cases of `foreign_key_test.rb` are ported
      into `packages/activerecord/src/migration/foreign-key.test.ts`, test names
      matching Rails verbatim.
- [ ] Cases run against the ambient connection via `withRocketTables` — no
      bespoke tables, no new `:memory:` adapter.
- [ ] `unless current_adapter?(:SQLite3Adapter)` / adapter guards are honored
      rather than dropped.
- [ ] `parity:test` delta for `foreign_key_test.rb` is strictly positive.
- [ ] Green on all three adapters.
