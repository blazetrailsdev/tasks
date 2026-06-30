---
rfc: "0049-one-schema-no-drop-perf"
title: "One-schema no-drop test mode (perf)"
status: draft
created: 2026-06-30
updated: 2026-06-30
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
related-rfcs:
  - "0048-one-schema-no-drop-tests"
---

## Summary

Run the ActiveRecord test suite against a **single, once-built schema**: lay the
canonical `TEST_SCHEMA` into each worker DB once at boot and **never `DROP TABLE`**
during the run, truncating canonical tables per-test instead. This is a
**test-suite performance** effort (eliminate DROP-TABLE churn), split out from
RFC 0048, which now owns only the Rails-fidelity test convergence.

## Status

Parked behind RFC 0048. The Rails-faithful convergence of the data-layer test
files (0048) is the prerequisite: one-schema mode requires every test to ride
canonical tables, which is exactly what 0048 now delivers properly (faithful
ports, not shallow renames). Resume this RFC once 0048 lands.

## Mechanism (spike)

`AR_ONE_SCHEMA=1` was prototyped in spike **PR #4246** (OPEN, unmerged): a no-op
`defineSchema` under the flag, a truncate-only `resetTestAdapterState`, a `force`
escape hatch for boot/repair builders, and an `OneSchemaViolation` matcher.
That spike must be reviewed/landed (or re-derived) as the first story here.

## Motivation

`DROP TABLE` dominates test DDL cost: ~86k drops/run, 63% (Postgres) / 87%
(MariaDB) of DDL milliseconds, ~12:1 drop:create ratio — teardown churn, not
`CREATE`, is the lever.

## Stories (to migrate from 0048)

- Land/review the `AR_ONE_SCHEMA` spike (PR #4246).
- `one-schema-excluded-backend-coverage` — per-backend flag-off coverage for
  excluded files.
- `one-schema-maria-date-multiparameter-reflection` — MariaDB warm-cache
  reflection bug surfaced under one-schema.
- Burn `eslint/one-schema-exclude.json` toward only the permanent exclusions
  (own-DB tests + `test-helpers/*` self-tests) once 0048 converges the data layer.
