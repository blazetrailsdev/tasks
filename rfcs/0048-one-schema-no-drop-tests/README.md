---
rfc: "0048-one-schema-no-drop-tests"
title: "One-schema no-drop AR test suite"
status: draft
created: 2026-06-28
updated: 2026-06-28
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
related-rfcs:
  - "0019-canonical-schema-burndown"
---

## Summary

Run the ActiveRecord test suite against a **single, once-built schema**: lay the
canonical `TEST_SCHEMA` into each worker DB once at boot and **never `DROP
TABLE`** during the run. Per-test cleanup truncates the canonical tables instead
of dropping/recreating them, matching Rails' actual test posture
(`use_transactional_tests = true`, `schema.rb` loaded once) rather than trails'
per-test `dropAllTables`.

The mechanism (`AR_ONE_SCHEMA=1`) landed in the spike PR #4246: a no-op
`defineSchema` under the flag, a truncate-only `resetTestAdapterState`, a
`force` escape hatch for boot/repair builders, and a canonical-compatibility
matcher that flags genuine deviations (`OneSchemaViolation`). CI runs the three
AR lanes in one-schema mode with DDL profiling; files that can't yet comply are
listed in `eslint/one-schema-exclude.json` and covered flag-off by a dedicated
sqlite lane.

## Motivation

`DROP TABLE` dominates test DDL cost: a profiled run showed ~86k drops, with
DROP responsible for 63% (Postgres) / 87% (MariaDB) of DDL milliseconds and a
~12:1 drop:create ratio — teardown churn, not `CREATE`, is the lever. Eliminating
inter-test drops removes that churn on the DDL-bound PG/MySQL lanes and converges
the harness toward Rails' real schema-once + transactional-fixtures model.

## Prerequisite

This RFC assumes **RFC 0019 (canonical-schema-burndown) is complete** before it
starts. One-schema mode requires every data-layer test to ride canonical
`TEST_SCHEMA` tables/columns; the pre-canonical bespoke-table files (e.g.
`users.name`, `posts.subtitle`, `topics.score`) that 0019 converges are exactly
the files currently parked in the one-schema exclude list. With 0019 at zero,
the data-layer exclusions collapse and this RFC is left with only the
infra/adapter exclusions + harness polish.

## Scope

- Converge the data-layer files that invent bespoke tables/columns on canonical
  tables (RFC 0019 surface) — the 7 `converge-*` clusters.
- Converge the Rails-style migration/schema/adapter DDL tests so they RIDE the
  single schema (most are not permanent exclusions — see the convention below).
- Close the harness gaps: per-backend flag-off coverage for adapter excluded
  files; the MariaDB date/multiparameter warm-cache reflection bug.
- Burn `eslint/one-schema-exclude.json` toward only the genuinely-permanent
  exclusions (own-DB tests + the `test-helpers/*` schema/fixtures self-tests).

## Convention: scratch tables use non-canonical names

Tests that exercise `create_table`/`drop_table` (migration, schema-dumper,
adapter DDL) DO ride the single schema, exactly as Rails' migration suites do —
**provided their scratch tables use names absent from the canonical
`TEST_SCHEMA`** (mirror Rails' `horses`/`testings`). A test must never
create/alter/drop a canonical table: the per-test reset truncates but never
restores shape, and `repairWorkerSchema` only restores it for the next file.
The trails ports that fail under one-schema do so because they reused canonical
names (`items`, `users`, `widgets`) as scratch — the fix is to rename them, not
to exclude the file. Direct `createTable`/`dropTable` never trip the one-schema
guard (only `defineSchema` does).

## Stories

See the stories directory: 7 data-layer `converge-*` clusters (deps-rfc 0019),
5 DDL/adapter `converge-*-one-schema` clusters (independent of 0019),
`one-schema-excluded-backend-coverage`, and
`one-schema-maria-date-multiparameter-reflection`.
