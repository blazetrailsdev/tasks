---
title: "Drop the fixtures schema arg (default off) and delete escape hatches"
status: ready
updated: 2026-07-05
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc:
  - 0019-canonical-schema-burndown
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

# Drop the fixtures `schema` arg (default off) and delete the escape hatches

Part 4 of 4 converging the AR fixtures helper to the Rails surface (RFC 0048
capstone). **Gated on RFC 0019 → 0** (deps-rfc 0019-canonical-schema-burndown):
this is the only sub-story that needs the burndown complete, because the schema
arg's last legitimate users are bespoke-table tests.

## Context

globalSetup lays the full TEST_SCHEMA into each worker DB once and clones it to
every per-worker slot DB (test-helpers/template-global-setup.ts:54) — trails'
db:test:prepare. So canonical tables already exist before any test runs. The
`{ schema }` arg only drives a beforeAll that slices + `defineSchema`s tables
(use-fixtures.ts:435-438). Under AR_ONE_SCHEMA=1 that `defineSchema` is already a
no-op for canonical tables (or throws OneSchemaViolation for bespoke), so for any
converged test the arg is pure ceremony AND adds DROP+CREATE churn into the
already-dominant DROP-TABLE cost (DDL profiler: ~86k drops/run). Rails'
`fixtures :authors` never takes a schema.

"Must pass a schema" correlates 1:1 with "table is bespoke, not in the template" —
exactly what 0019 retires. Hence the gate.

## Acceptance criteria

- [ ] The `schema` arg defaults to off — canonical tables assumed present from the
      template clone.
- [ ] With 0019 at zero, the explicit `schema` / `dropExisting` escape hatch is
      DELETED (no remaining bespoke-table callers). If any genuinely-permanent
      own-DB cases survive, document them explicitly rather than keeping the arg
      broadly available.
- [ ] A converged canonical file reads `setupFixtures(); fixtures({ authors,
posts, comments });` — no schema, no registerModel, no "handler".
- [ ] test:compare does not regress; no test names change.

## Notes

- Depends on parts (a)/(b)/(c) for the no-registerModel / no-handler surface, and
  on RFC 0019 for removing the last schema-arg callers.
