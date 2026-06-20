---
title: "Gate missing-gate tests in schema_dumper + invertible_migration (12)"
status: ready
updated: 2026-06-20
rfc: "0032-ar-gate-fidelity-burndown"
cluster: missing-gate
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC `0032-ar-gate-fidelity-burndown`, cluster `missing-gate`. Follow-up from
`gate-missing-gate-burndown` (PR #3708). 12 `missing-gate` mismatches across two
files: `schema-dumper.test.ts` (7) and `invertible-migration.test.ts` (5).

- `schema_dumper_test.rb`: `supports_foreign_keys?` (3 FK-dump tests) and
  `current_adapter?(:PostgreSQLAdapter)` (bigint default, 3 timestamp-type
  dump variants).
- `invertible_migration_test.rb`: `supports_comments?` (2 revert change comment
  tests), `current_adapter?(:PostgreSQLAdapter)` (enable/disable extension),
  `current_adapter?(:PostgreSQLAdapter,:SQLite3Adapter)` (revert add index with
  name), `supports_unique_constraints?` (revert add unique constraint).

Refresh exact gates via `pnpm test:compare --package activerecord --gates --json`.

## Acceptance criteria

- [ ] Apply exact Rails gates to all 12 tests across both files (feature
      predicates via `itIfSupports`; adapter sets via `it.skipIf`).
- [ ] `test:compare --gates` reports 0 `missing-gate` for both
      `schema-dumper.test.ts` and `invertible-migration.test.ts`.
- [ ] Test names unchanged. No stubs. 500-LOC ceiling.
