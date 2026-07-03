---
title: "Flip the global beforeEach reset from dropAllTables to truncation"
status: ready
updated: 2026-07-03
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The single dominant DDL-churn source measured in PR #4499: the global
`beforeEach` in `packages/activerecord/src/test-setup-ar.ts:45` calls
`resetTestAdapterState()` unless `shouldSkipGlobalReset()`
(`test-helpers/skip-global-reset.ts`, the transactional-fixtures refcount).
`resetTestAdapterState()` (`packages/activerecord/src/test-adapter.ts:318`)
unconditionally calls `dropAllTables(adapter)` — dropping **every** table over
~330 canonical tables, for every test in every non-transactional file. That is
the ~90–97k `DROP_TABLE`/run fan-out (~95% of schema-DDL ms on all 3 adapters;
`posts`/`authors`/`topics`/… each dropped 250–520× — PR #4499 findings).

RFC 0059 lays the canonical schema once at boot
(`test-helpers/template-global-setup.ts`) and keeps it shape-stable, so dropping
the tables between tests is pure redundancy — only the rows need clearing.
Rails isolates with truncation / transactional rollback
(`use_transactional_tests`), never per-test `DROP TABLE`. A truncate primitive
already exists on the adapters (`truncateTables` /
`connection-adapters/abstract/database-statements.ts:685`, the
`disableReferentialIntegrity`-wrapped `doTruncate`).

## Acceptance criteria

- `resetTestAdapterState()` clears row state by **truncating the boot-laid
  canonical tables** instead of `dropAllTables()`; schema (tables/indexes) is
  left intact. Schema-cache clear + `clearAppliedSchemaSignatures()` +
  `Base._modelsByName.clear()` behavior is preserved.
- A drop is retained **only** as a fallback for genuinely non-canonical tables a
  file created (detect tables not in the boot canonical set and drop just
  those), so bespoke `defineSchema(adapter,{tables})` callers not yet converted
  under RFC 0059 §3 don't leak. Do NOT convert those bespoke tables here (out of
  scope — RFC 0059 §3 / RFC 0019).
- Re-run the PR #4499 `DDL_PROFILE=1` protocol: `DROP_TABLE` ops reduced ≥ 90%
  on each adapter vs baseline (sqlite 90,094 / PG 96,799 / MariaDB 95,190).
- Full AR suite green on all 3 lanes; `test:compare` delta ≥ 0; no cross-file
  leakage regressions (shared-DB shape-drift / posts / items / accounts flake
  set stays green).
