---
title: "c1-schema-dumper-pg-decimal-array"
status: done
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3431
claim: "2026-06-16T00:52:53Z"
assignee: "c1-schema-dumper-pg-decimal-array"
blocked-by: null
---

## Context

Spun off from `c1-schema-dumper-residual-gaps` (RFC 0030). This is the remaining
PostgreSQL decimal-array gap not covered by that story's cross-adapter work.

**`schema dump allows array of decimal defaults`** — a `decimal[]` column with an
array default introspects with a bogus base type (`"value"`), so the dump emits
`t.column("decimal_array_default", "value", …)` instead of
`t.decimal(…, { default: [...], array: true })`. Fix in PG decimal-array
introspection type resolution so the element type resolves to `decimal`.

Rails source: `vendor/rails/activerecord/test/cases/schema_dumper_test.rb`
(`test_schema_dump_allows_array_of_decimal_defaults` :376). Rails asserts:
`t.decimal "decimal_array_default", default: ["1.23", "3.45"], array: true`.
Fixture (`postgresql_specific_schema.rb` :138):
`t.decimal :decimal_array_default, array: true, default: [1.23, 3.45]`.

The test in `schema-dumper.test.ts` is currently `it.skip("schema dump allows
array of decimal defaults", ...)`.

## Acceptance criteria

- [ ] `schema dump allows array of decimal defaults` un-skipped (PG-gated), passes on postgres.
- [ ] Dump emits `t.decimal(...)` with `array: true` and the array default, not a
      `t.column(..., "value", ...)` fallback.
- [ ] Test name matches Rails verbatim. No new gate-mismatches.
