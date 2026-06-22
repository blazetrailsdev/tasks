---
title: "PG float infinity/NaN column default schema dump"
status: done
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 30
pr: 3872
claim: "2026-06-22T11:55:58Z"
assignee: "schema-dumper-pg-infinity-float-default"
blocked-by: null
---

## Context

`packages/activerecord/src/schema-dumper.test.ts` "schema dump with column
infinity default" is gated `adapterType !== "postgres"` (Rails
`schema_dumper_test.rb`, inside `if current_adapter?(:PostgreSQLAdapter)`) but
`ctx.skip()`-pending. PG default-introspection renders float defaults as the bare
string `"Infinity"`/`"NaN"` (no `::float` cast), while datetime/date defaults are
already emitted as the Ruby literal `::Float::INFINITY` via the OID type's
`typeCastForSchema` — so the fix is in the PG default-introspection path, not in
`cleanDefault`. No open tracking story (distinct from the closed
`c1-schema-dumper-*` set).

## Acceptance criteria

- [ ] PG float infinity/NaN column defaults dump as `::Float::INFINITY` /
      `-::Float::INFINITY` / `::Float::NAN` matching Rails.
- [ ] Drop `ctx.skip()`; test runs on PG.
- [ ] `test:compare` delta non-negative; test name unchanged.
