---
title: "Make the pre-snapshot boot-laid fallback purge-only by construction"
status: done
updated: 2026-08-02
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 2
pr: 5904
claim: "2026-08-02T18:13:29Z"
assignee: "boot-laid-fallback-silently-drops-adapter-specific-tables"
blocked-by: null
closed-reason: null
---

## Context

`bootLaidTableNames()` in
`packages/activerecord/src/support/drop-all-tables.ts` falls back to
`CANONICAL_TABLE_NAMES` (the `TEST_SCHEMA` keys) when `recordBootLaidTables` has
not run yet. That fallback covers only the `schema.rb` half: the
`<adapter>_specific_schema.rb` tables (`defaults`, `postgresql_times`,
`binary_fields`, …) are absent from it, so a `resetTestTables` on that path drops
them, and nothing re-lays them afterwards.

Today exactly one caller hits the pre-snapshot path, and it wants that behavior:
`test-setup-dy.ts` runs `resetTestTables` between the canonical load and the
adapter-specific arm precisely to purge leftovers, and the arm re-lays its tables
immediately after (PR #5659). The hazard is that nothing marks the fallback as
purge-only — a future pre-snapshot caller, or a reordering that moves the arm
before the purge, silently loses the adapter-specific tables for the whole run,
with the symptom appearing far away as "table `defaults` does not exist".

## Acceptance criteria

- Make the pre-snapshot path explicit rather than implicit: e.g. a distinct
  purge-mode entry point for the boot call, or an assertion/typed flag that a
  `reset` without a recorded snapshot is deliberate.
- The boot order in `test-setup-dy.ts` keeps working unchanged.
- A guard fails if the adapter-specific arm is moved before the purge, or if a
  `reset` runs pre-snapshot without opting in.
