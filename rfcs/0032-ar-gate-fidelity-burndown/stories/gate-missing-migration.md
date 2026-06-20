---
title: "Gate missing-gate tests in migration_test.rb (20)"
status: ready
updated: 2026-06-20
rfc: "0032-ar-gate-fidelity-burndown"
cluster: missing-gate
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC `0032-ar-gate-fidelity-burndown`, cluster `missing-gate`. Follow-up from
`gate-missing-gate-burndown` (PR #3708). 20 `missing-gate` mismatches remain in
`packages/activerecord/src/migration.test.ts`. Rails gates in
`vendor/rails/activerecord/test/cases/migration_test.rb`:
`supports_ddl_transactions?` (3 rollback/transaction tests),
`supports_advisory_locks?` (3 lock tests), `supports_bulk_alter?` (9
BulkAlterTableMigrationsTest tests), and adapter guards for out-of-range
integer/text/binary limit (`current_adapter?(:Mysql2,:Trilogy,
:PostgreSQLAdapter)` → mysql+pg), invalid text size (mysql), add/remove index
(pg).

Refresh exact gates via `pnpm test:compare --package activerecord --gates --json`.

## Acceptance criteria

- [ ] Apply the exact Rails gate to each of the 20 tests (feature predicates via
      `itIfSupports`/`describeIfSupports`; adapter sets via
      `describe.skipIf`/`it.skipIf(adapterType …)`).
- [ ] `test:compare --gates` reports 0 `missing-gate` for `migration.test.ts`.
- [ ] Test names unchanged. No stubs. 500-LOC ceiling.
