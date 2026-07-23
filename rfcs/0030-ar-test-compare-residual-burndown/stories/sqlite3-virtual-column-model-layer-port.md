---
title: "sqlite3-virtual-column-model-layer-port"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
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

PR #5127 converged `adapters/sqlite3/virtual-column.test.ts` to Rails'
`virtual_column_test.rb` values, but at the adapter level: raw DDL +
`adapter.columns()` predicates + SELECTs, with a local `columnsHash()`
helper standing in for `VirtualColumn.columns_hash` and SELECT standing in
for `VirtualColumn.take.<attr>`. Rails
(vendor/rails/activerecord/test/cases/adapters/sqlite3/virtual_column_test.rb)
drives everything through a `VirtualColumn < ActiveRecord::Base` model over
a `create_table :virtual_columns` built with `t.virtual` (the trails
adapter's `createTable`/`t.virtual` path already renders GENERATED —
schema-creation.ts covers it).

Three Rails tests remain null-overridden in the trails file
(virtual-column.test.ts:116):

- `test_virtual_column_with_full_inserts` — needs `partial_inserts = false`
  model insert path over generated columns.
- `test_schema_dumping` — asserts
  `t.virtual "upper_name", type: :string, as: "UPPER(name)", stored: true`
  in `dump_table_schema` output; sqlite3/schema-dumper.ts already emits
  virtual specs (schema-dumper.ts:38) so this may be mostly wiring.
- `test_build_fixture_sql` — `FixtureSet.create_fixtures(FIXTURES_ROOT,
:virtual_columns)` must skip generated columns in the INSERT; Rails
  fixture file test/fixtures/virtual_columns.yml has 2 rows.

## Acceptance criteria

- virtual-column.test.ts uses a `VirtualColumn` model + `t.virtual`
  create_table like Rails (columns_hash, take) instead of raw DDL/SELECTs.
- The three null-overridden tests are ported (or each re-justified with a
  concrete blocker at the call site).
- test:compare kind-mismatches for virtual_column_test.rb drop to 0.
