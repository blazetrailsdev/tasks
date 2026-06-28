---
rfc: "0000-one-schema-no-drop-tests"
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

- Burn `eslint/one-schema-exclude.json` toward only the legitimately-permanent
  infra/adapter-machinery exclusions (migration/schema-dumper/adapter tests).
- Close the harness gaps surfaced by the spike: per-backend flag-off coverage
  for adapter excluded files; the MariaDB date/multiparameter warm-cache
  reflection bug.
- Decide the end-state CI shape (keep `AR_ONE_SCHEMA=1` standard; trim or keep
  the DDL-profile discovery scaffolding).

## Stories

See the stories directory. Initial set migrated from the spike:
one-schema-excluded-data-layer-convergence, one-schema-excluded-backend-coverage,
one-schema-maria-date-multiparameter-reflection.
