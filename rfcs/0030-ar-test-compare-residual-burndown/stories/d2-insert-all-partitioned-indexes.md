---
title: "insert-all.test.ts: unblock upsert_all partitioned-indexes test (PG)"
status: done
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3454
claim: "2026-06-16T13:35:00Z"
assignee: "d2-insert-all-partitioned-indexes"
blocked-by: null
---

## Context

Follow-up from d2-insert-all-canonical-models (PR #3446, RFC 0030). The test
`upsert all works with partitioned indexes` remains `it.skip` in
`packages/activerecord/src/insert-all.test.ts` (was left skipped as it is
PG-only and out of that PR's scope/budget).

Maps to Rails `vendor/rails/activerecord/test/cases/insert_all_test.rb:694-707`
(`test_upsert_all_works_with_partitioned_indexes`), gated on
`supports_insert_on_duplicate_update? && supports_insert_conflict_target? &&
supports_partitioned_indexes?` → PostgreSQL >= 11 only.

Needs:

- The canonical `measurements` partitioned table from
  `vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb:186-198`:
  `create_table(:measurements, id: false, options: "PARTITION BY LIST (city_id)")`
  with `string city_id`, `date logdate`, `integer peaktemp`, `integer unitsales`,
  a `unique index [:logdate, :city_id]`, plus the `measurements_toronto`
  (`FOR VALUES IN (1)`) and `measurements_concepcion` (`FOR VALUES IN (2)`)
  partitions. Our `defineSchema` has no partition DSL, so this needs raw PG DDL
  in a `beforeAll` guarded by `adapterType === "postgres"` +
  `supportsPartitionedIndexes()` (postgresql-adapter.ts:2684).
- The canonical `Measurement` model (test-helpers/models/measurement.ts is an
  empty `class Measurement extends Base {}`) to load its columns from DB schema
  introspection (no attributes declared), or declared attributes in the test.
- `upsertAll(..., uniqueBy: ["logdate", "city_id"])` against the partitioned
  unique index, then `pluck(:logdate, :peaktemp, :unitsales)` assertions with
  relative-date values (`1.day.ago`, `2.days.ago`, `3.days.ago`).

Likely depends on / overlaps `d2-insert-all-unique-index-introspection` for
composite-unique-index lookup; sequence after that lands.

## Acceptance criteria

- [x] `upsert all works with partitioned indexes` un-skipped and passing on the
      PG lane (PG >= 11), still skipped on sqlite/mysql via skipIf.
- [x] `measurements` partitioned table + partitions created via PG raw DDL,
      mirroring postgresql_specific_schema.rb (no invented columns).
- [x] Assertions match insert_all_test.rb:703-706 verbatim.
- [x] Test name matches Rails verbatim.
