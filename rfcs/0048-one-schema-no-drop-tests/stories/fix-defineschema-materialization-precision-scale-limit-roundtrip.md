---
title: "fix-defineschema-materialization-precision-scale-limit-roundtrip"
status: done
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: 4378
claim: "2026-07-01T17:08:10Z"
assignee: "fix-defineschema-materialization-precision-scale-limit-roundtrip"
blocked-by: null
---

## Context

Follow-up to `converge-schema-dumper-test-canonical-schema` (PR #4366).

When `defineSchema` materializes the canonical `TEST_SCHEMA` and the schema
dumper reflects it back on SQLite, decimal `precision`/`scale` and integer
`limit` are lost — a materialized `t.decimal("atoms_in_universe", { precision: 55 })`
dumps as a bare `t.decimal("atoms_in_universe")`, and `integer_limits.c_int_*`
dump without their `limit:`. (A freshly-built `MigrationContext.createTable`
DDL reflects faithfully, which is why the bespoke forms pass.)

Because of this, three `SchemaDumperTest` cases could not converge onto the
canonical `numeric_data` / `integer_limits` and stay on ad-hoc tables in
`packages/activerecord/src/schema-dumper.test.ts`:
`schema dump includes decimal options`,
`schema dump keeps large precision integer columns as decimal`,
`schema dump includes limit constraint for integer columns`.

Rails' faithful forms are `dump_all_table_schema([/^[^n]/])` /
`dump_all_table_schema([/^(?!integer_limits)/])` over the loaded schema, with
per-adapter `limit` expectations for `integer_limits.c_int_1..8`
(`vendor/rails/activerecord/test/cases/schema_dumper_test.rb`).

## Acceptance criteria

- [ ] Determine whether the loss is in `defineSchema`'s DDL emission (not
      emitting `DECIMAL(p,s)` / integer limit) or in SQLite column reflection,
      and fix so a `defineSchema`-materialized canonical table round-trips
      precision/scale/limit through the dumper.
- [ ] Converge the three deferred cases onto canonical `numeric_data` /
      `integer_limits` via `standard_dump`, restoring Rails' faithful
      ignore-regex forms and per-adapter `integer_limits` branches.
- [ ] test:compare non-negative.
