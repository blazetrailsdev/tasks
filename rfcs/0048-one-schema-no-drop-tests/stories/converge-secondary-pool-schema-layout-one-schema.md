---
title: "Lay canonical schema into secondary adapters/pools under one-schema (converge transaction-instrumentation, multiple-db, habtm)"
status: blocked
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
blocked-by: "Stale pre-respec artifact. Every acceptance criterion depends on AR_ONE_SCHEMA / eslint/one-schema-exclude.json / the define-schema.ts:589 force no-op (spike PR #4246), which do NOT exist on main and were explicitly split out to parked RFC 0000-one-schema-no-drop-perf in the 2026-06-30 re-spec (see RFC 0048 README 'Out of scope'). Nothing to build here: the three named tests (transaction-instrumentation, multiple-db, has-and-belongs-to-many-associations) already pass on main; there is no one-schema mode to converge them under. Same blocker as sibling converge-migrator/migration-ddl-tests-one-schema. Re-spec or move to the perf RFC before re-claiming."
closed-reason: null
---

## Context

> **⚠️ HOW TO WORK THIS — read before blocking (2026-07-02).** This is live
> one-schema burndown work, executed on branch **`existing-db-schema-rc-9807c5`**
> — check that branch out before doing anything or judging feasibility.
>
> - The one-schema harness (`AR_ONE_SCHEMA`, `eslint/one-schema-exclude.json`,
>   `test-helpers/one-schema.ts`, the `define-schema.ts` no-op/`force` path) is
>   **committed on that branch, NOT on `main`.** Do not conclude "infra absent"
>   from a `main` checkout.
> - **Spike PR #4246 is ABANDONED and will NOT be merged.** Do NOT block on it or
>   wait for it — "re-open once #4246 merges" is wrong. The infra was landed
>   directly on the branch instead. Any prior blocked-by note saying otherwise is
>   superseded.
> - The RFC 0048 README's "one-schema mode is out of scope → RFC 0049" note is
>   **superseded** for this burndown; it is being executed here, on the branch.
> - The named tests **fail under the flag** even though they pass flag-off.
>   Reproduce on the branch: remove this file's path from
>   `eslint/one-schema-exclude.json`, then `AR_ONE_SCHEMA=1 pnpm vitest run <file>`.
>   Fix until green and leave the path removed from the exclude in your PR.

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
