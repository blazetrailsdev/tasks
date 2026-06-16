---
title: "change_table proxy surfaces t.serial/t.bigserial (PG ColumnMethods not in NATIVE_DATABASE_TYPES)"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during `change-table-recorder-adapter-column-methods` (RFC 0030, PR #3455).
The `change_table` proxy (`withAdapterColumnMethods` in
`packages/activerecord/src/migration/command-recorder.ts`) derives its
adapter-specific column-type shorthand set from the connection's
`nativeDatabaseTypes()`. Rails instead mixes in the adapter's `ColumnMethods`
module, whose shorthand list is the explicit `define_column_methods(...)` call
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_definitions.rb:185-188`).

Diffing PG's `define_column_methods` list against trails'
`NATIVE_DATABASE_TYPES` (`postgresql-adapter.ts:256`), the only entries present
in Rails' `ColumnMethods` but absent from trails' native types are `serial`
and `bigserial`. So inside a reversible `change` migration,
`t.serial :foo` / `t.bigserial :foo` raise "is not a function", whereas Rails
exposes them (they map to `SERIAL` / `BIGSERIAL` via the pg `TableDefinition`).
This is documented as a known deviation in the `withAdapterColumnMethods`
doc-comment and `NON_COLUMN_METHOD_TYPES` note.

Note: this is a small, out-of-scope-for-#3455 gap. `serial`/`bigserial` are
SERIAL/BIGSERIAL pseudo-types rarely added to an existing table via
`change_table`; the un-skip campaign's target column types (hstore, jsonb,
uuid, inet, ...) are all covered.

## Acceptance criteria

- [ ] `t.serial` / `t.bigserial` resolve inside a recording-mode `change_table`
      block (and the non-recording path), recording `addColumn(name, "serial"|"bigserial", ...)`
      faithful to Rails' pg `ColumnMethods`.
- [ ] Approach converges toward Rails' explicit `define_column_methods` set
      rather than `nativeDatabaseTypes` — e.g. expose the adapter's
      ColumnMethods shorthand names so `withAdapterColumnMethods` can use them
      (adapter-agnostic), instead of the native-types approximation.
- [ ] Add coverage for `t.serial` / `t.bigserial` round-trip (up adds, down removes).
