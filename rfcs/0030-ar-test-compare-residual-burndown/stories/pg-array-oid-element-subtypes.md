---
title: "PG array OID element subtypes: hstore[] / tz-aware datetime[] / timestamp[] precision"
status: in-progress
updated: 2026-06-17
rfc: "0030-ar-test-compare-residual-burndown"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 180
priority: 50
pr: 3531
claim: "2026-06-17T11:16:24Z"
assignee: "pg-array-oid-element-subtypes"
blocked-by: null
---

## Context

Surfaced by `e2-pg-ddl-via-exec` (RFC 0030). PG array (`OID::Array`) element
subtypes are incompletely wired for `hstore[]` and `timestamp[]`/`datetime[]`:

- `OID::HStore` is not registered as an array element subtype, and the
  canonical `pg_arrays` table omits the `hstores hstore[]` column, so an
  `hstore[]` value does not deserialize to per-element hash objects.
- `timestamp[]`/`datetime[]` round-trips through the DB mis-handle the element
  type: tz-aware `datetime[]` reads back shifted (the array element deserialize
  does not interpret the stored wall-clock the way the scalar path does), and
  microsecond precision is dropped on the `timestamp[]` round-trip.

Blocks three `adapters/postgresql/array.test.ts` tests (Rails `array_test.rb`):
`mutate value in array` (`test_mutate_value_in_array`),
`datetime with timezone awareness` (`test_datetime_with_timezone_awareness`),
`precision is respected on timestamp columns`
(`test_precision_is_respected_on_timestamp_columns`).

The canonical Rails table also declares `t.datetime :datetimes, array: true`,
`t.hstore :hstores, array: true`, and `t.timestamp :timestamps, ... precision: 6`
which the TS test table currently does not all carry.

## Acceptance criteria

- [ ] `OID::HStore` wired as an array element subtype; `hstore[]` deserializes
      to per-element hash objects.
- [ ] tz-aware `datetime[]` round-trips to identical `TimeWithZone` elements.
- [ ] `timestamp[]` preserves microsecond precision on the DB round-trip.
- [ ] `pg_arrays` table mirrors Rails (incl. `datetimes`, `hstores`,
      precision-6 `timestamps`).
- [ ] Un-skip the three array tests above; they pass under PG.
