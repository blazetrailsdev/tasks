---
title: "Convert remaining 28 setupFixtures/useHandlerTransactionalFixtures callers to fixtures()"
status: done
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: null
deps: ["audit-setupfixtures-caller-buckets"]
deps-rfc: []
est-loc: 500
priority: 0
pr: 4627
claim: "2026-07-05T18:01:58Z"
assignee: "convert-remaining-setupfixtures-callers-to-fixtures"
blocked-by: null
closed-reason: null
---

## Context

RFC 0062 terminal removal (`delete-setupfixtures-surface`) is blocked: the
deprecated surface still has 28 caller files / 58 call-sites outside
`test-helpers/`, so `setupFixtures` / `useHandlerTransactionalFixtures` cannot
be deleted yet. The earlier conversion stories are all done/closed but did not
drive callers to zero — the `sfonly` / `delete-redundant-*` buckets were CLOSED
(abandoned), leaving these files behind.

Gate (must reach zero):
`git grep -l "setupFixtures\|useHandlerTransactionalFixtures" 'packages/activerecord/src/**/*.test.ts' | grep -v test-helpers`

Two buckets among the 28:

1. **Canonical-schema convertible** (`setupFixtures()` + `beforeAll(loadCanonicalSchema)`,
   or per-describe `setupFixtures()` alongside `fixtures([...])`): convert to the
   `fixtures({...})` endgame surface.
   - `validations/numericality-validation.test.ts`
   - `type/integer.test.ts`
   - `relation/select.test.ts`, `relation/select-star-join-collision.test.ts`
   - `associations/inverse-associations.test.ts`, `associations/eager.test.ts`,
     `associations/callbacks.test.ts` (mixed per-describe — `setupFixtures()` at
     `callbacks.test.ts:56,535` next to `fixtures([...])` at `:565`)

2. **Bespoke non-canonical DDL adapter suites** (`setupFixtures()` for handler
   wiring + their own `createTable`/extension DDL, e.g. `hstore.test.ts:41,54`).
   `fixtures({})` transactional wrapping breaks PG DDL (see
   `project_fixtures_transactional_wrapping_breaks_pg_ddl`) — convert with
   `fixtures({}, { useTransactionalTests: false })` or an explicit
   handler-suite replacement that preserves non-transactional DDL.
   - `adapters/postgresql/`: bytea, citext, composite, create-unlogged-tables,
     domain, enum, foreign-table, hstore, interval, ltree, money, network,
     numbers, range, schema-authorization, schema, timestamp, uuid, xml
   - `adapters/abstract-mysql-adapter/`: mysql-explain, schema-migrations

Do NOT delete the surface here — that is the terminal story's job once this
reaches zero.

## Acceptance criteria

- All 28 caller files converted off `setupFixtures` /
  `useHandlerTransactionalFixtures`; the grep gate returns only `test-helpers/`
  internals.
- No test renames; `test:compare` delta >= 0.
- PG/MySQL adapter suites stay green (non-transactional DDL preserved).
- Likely exceeds 500 LOC across 28 files — split into per-bucket sibling
  stories from `main` (canonical bucket vs PG-DDL bucket) rather than one PR.
