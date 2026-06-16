---
title: "c1-schema-dumper-timestamptz-version-compat"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Spun off from `c1-schema-dumper-residual-gaps` (RFC 0030). These PostgreSQL
timestamptz / `datetime_type` and migration-version-compat gaps are a genuine
feature beyond the cross-adapter dumper work that story shipped. They are grouped
because both rewrite how datetime/timestamp columns are emitted based on
`PostgreSQLAdapter.datetimeType`.

### timestamptz / datetime_type family

- `schema dump with timestamptz datetime format`
- `schema dump when changing datetime type for an existing app`
- `schema dump with correct timestamp types via create table and t timestamptz`

Needs a `t.timestamptz` `TableDefinition` helper and a `datetime_type`-aware
dumper that rewrites timestamp/timestamptz columns based on
`PostgreSQLAdapter.datetimeType`.

### migration-version-compat family

- `timestamps schema dump before rails 7`
- `timestamps schema dump before rails 7 with timestamptz setting`
- `schema dump with correct timestamp types via add column before rails 7`
- `schema dump with correct timestamp types via add column before rails 7 with timestamptz setting`

Needs `Migration[6.1]` version compatibility (`ActiveRecord::Migration::Compatibility`),
which changes how datetime/timestamp columns are emitted.

Rails source: `vendor/rails/activerecord/test/cases/schema_dumper_test.rb`
(:645, :675, :701, :736, :771, :827, :853). All seven are `it.skip` in
`packages/activerecord/src/schema-dumper.test.ts`.

## Acceptance criteria

- [ ] All seven listed `it.skip` tests un-skipped (PG-gated) and passing on postgres.
- [ ] `t.timestamptz` TableDefinition helper added.
- [ ] datetime_type-aware dumper rewrites timestamp/timestamptz per `datetimeType`.
- [ ] `Migration[6.1]` version compatibility emits the pre-Rails-7 datetime forms.
- [ ] Test names match Rails verbatim. No new gate-mismatches. Likely >1 PR —
      split per non-overlapping files if so.
