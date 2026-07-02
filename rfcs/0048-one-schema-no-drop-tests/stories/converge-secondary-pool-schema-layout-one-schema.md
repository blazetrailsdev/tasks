---
title: "Lay canonical schema into secondary adapters/pools under one-schema (converge transaction-instrumentation, multiple-db, habtm)"
status: claimed
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 1
pr: null
claim: "2026-07-02T02:00:00Z"
assignee: "converge-secondary-pool-schema-layout-one-schema"
blocked-by: null
closed-reason: null
---

## Context

Under one-schema (`AR_ONE_SCHEMA=1`) the canonical `TEST_SCHEMA` is laid into the
**main per-worker pool** once at boot, and `defineSchema` becomes a no-op that only
asserts canonicality (`define-schema.ts:589` — skips real DDL unless `force`).
Tests that seed through a **secondary adapter/pool** therefore never get their
(canonical!) tables created on that adapter, and fail at query time. Verified
2026-07-01 by probing under the flag with an emptied exclude:

- `transaction-instrumentation.test.ts` — builds its own `sharedAdapter`;
  `defineSchema(adapter, { topics: canonicalSchema.topics })` (line 37) no-ops →
  `StatementInvalid: Could not find table 'topics'`.
- `multiple-db.test.ts` — seeds through `College.connection` / `Course.connection`
  (second pool) → `Could not find table 'colleges'`.
- `has-and-belongs-to-many-associations.test.ts` — uses `setup-second-pool.ts`
  (`professors`, `courses_professors`) → `no such table: professors`.

All these tables (`topics`, `colleges`, `courses`, `entrants`, `professors`,
`courses_professors`) ARE in canonical `TEST_SCHEMA` — this is NOT a bespoke-schema
deviation, it is a boot-layout gap for non-main adapters. (This reclassifies
`multiple-db.test.ts` as convergeable, not a permanent multi-DB exempt.)

## Acceptance criteria

- Under one-schema, secondary adapters/pools get the canonical schema laid down
  (either lay canonical into every leased adapter at boot, or have
  `defineSchema(secondaryAdapter, canonicalSubset)` actually create the tables —
  the existing `force` option on `define-schema.ts:589` is the lever — pick the
  approach that stays truncate-reset-clean for the main pool).
- `transaction-instrumentation.test.ts`, `multiple-db.test.ts`, and
  `has-and-belongs-to-many-associations.test.ts` pass under one-schema.
- All three removed from `eslint/one-schema-exclude.json`.
- No test renames; no bespoke tables introduced (tables are already canonical).
