---
title: "temp sqlite DB sweep is wired to the sqlite lane only"
status: ready
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5580 made temp sqlite DB cleanup survive vitest's fork pool by sweeping from
globalSetup's teardown (`sweepRunDbFiles` in
`packages/activerecord/src/support/sqlite-template.ts`). That sweep is wired
into the **sqlite** adapter branch only
(`support/template-global-setup.ts`, `sqliteAdapter.provision`), so two paths
still leak:

- **PG / MySQL runs.** `scratchDatabasePath`
  (`support/scratch-database.ts:53`) builds on-disk sqlite files regardless of
  the active lane — `multi-db-migrator.test.ts:52-53` calls
  `makeSqliteAdapter(...)` with no lane gate. On a non-sqlite run
  `sqliteAdapter.isActive()` is false, so neither `sweepStaleDbFiles` nor
  `sweepRunDbFiles` ever runs and those files accumulate until a later sqlite
  run's 6h stale sweep collects them.
- **Token-less paths.** With `AR_TEST_RUN_TOKEN` unset, `scratchDatabasePath`
  falls back to the literal token `"x"` and `fallbackDatabasePath`
  (`support/connection.ts:333-338`) mints a random per-process token. Neither
  is stamped with the run token the teardown sweeps by, so only the age-gated
  stale sweep reaches them.

## Acceptance criteria

- The run-token sweep (or an equivalent) runs at teardown on every lane, not
  only sqlite — e.g. hoist `sweepStaleDbFiles`/`sweepRunDbFiles` out of
  `sqliteAdapter` into the shared `setup()` dispatch in
  `template-global-setup.ts`.
- Token-less scratch/fallback paths are covered: either stamp them with the
  run token so the sweep matches them, or sweep them explicitly.
- A PG (or MySQL) local run leaves no new `ar-test-*` files in the temp dir.
