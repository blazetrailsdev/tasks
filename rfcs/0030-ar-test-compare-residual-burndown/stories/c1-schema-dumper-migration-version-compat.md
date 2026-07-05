---
title: "c1-schema-dumper-migration-version-compat"
status: blocked
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps:
  - c1-schema-dumper-timestamptz-version-compat
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-06-16T01:32:52Z"
assignee: "c1-schema-dumper-migration-version-compat"
blocked-by: "Depends on machinery (datetimePhysicalType / pgRealTypeUnlessAliased / datetime_type-aware dumper) from parent story c1-schema-dumper-timestamptz-version-compat, whose PR #3433 is still OPEN/unmerged. The 2 timestamptz tests require the parent's dumper-side rewrite, and this story must edit the same schema-dumper.ts/schema-dumper.test.ts the parent already changes — building from main would require stacking or duplicating unmerged code (both forbidden). Unblock once #3433 merges."
---

## Context

Split off from `c1-schema-dumper-timestamptz-version-compat` (RFC 0030). That
story shipped the PostgreSQL `t.timestamptz` helper + a `datetime_type`-aware
schema dumper (3 of 7 tests). The remaining 4 tests need
`ActiveRecord::Migration::Compatibility` version `Migration[6.1]`, which is not
yet implemented (`packages/activerecord/src/migration/compatibility.ts` only has
a thin version registry — no V6_1 class with the PostgreSQL datetime override).

Rails behavior (`vendor/rails/.../migration/compatibility.rb:164-225`,
`PostgreSQLCompat.compatible_timestamp_type`): under `Migration[6.1]`, on
PostgreSQL `:datetime` is rewritten to `:timestamp` at column-definition /
`add_column` time. So a `t.datetime` / `add_column :datetime` under
`Migration[6.1]` physically creates `timestamp without time zone` even when
`PostgreSQLAdapter.datetime_type = :timestamptz`. On dump (now datetime_type-
aware via the parent story), physical `timestamp` → `:timestamp` when
datetime_type is `:timestamptz`, else `:datetime`.

The datetime_type-aware dumper machinery already exists: a PG ColumnDefinition
records `datetimePhysicalType` and `MigrationContext.columns()` rewrites it via
`pgRealTypeUnlessAliased` (see parent PR). The new work is wiring the
`Migration[6.1]` compatibility layer so the recorded physical type is
`timestamp` (not the live datetime_type) for `:datetime` columns created under
v6.1.

The 4 tests are `it.skip` in `packages/activerecord/src/schema-dumper.test.ts`:

- `timestamps schema dump before rails 7` (Rails :675)
- `timestamps schema dump before rails 7 with timestamptz setting` (:701)
- `schema dump with correct timestamp types via add column before rails 7` (:827)
- `schema dump with correct timestamp types via add column before rails 7 with timestamptz setting` (:853)

## Acceptance criteria

- [ ] `Migration[6.1]` (`Compatibility::V6_1`) implemented with the PostgreSQL
      `compatible_timestamp_type` override (`:datetime` → `:timestamp`) on both
      `create_table` (TableDefinition.new_column_definition) and `add_column`.
- [ ] The 4 listed `it.skip` tests un-skipped (PG-gated) and passing on postgres.
- [ ] Test names match Rails verbatim. No new gate-mismatches.
- [ ] 300 LOC ceiling. Single PR from main. No stacked PRs.
