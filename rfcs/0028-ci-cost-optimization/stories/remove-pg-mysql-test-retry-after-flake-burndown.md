---
title: "Remove PG/MySQL test retry:2 once shared-DB flake class is provably gone"
status: blocked
updated: 2026-06-25
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: 5
pr: 4136
claim: "2026-06-25T17:27:53Z"
assignee: "remove-pg-mysql-test-retry-after-flake-burndown"
blocked-by: "Gate not met: removing retry:2 immediately re-exposed shared-DB shape-drift flakes on BESPOKE tables (defaults schema-dump drift on MariaDB; hot_compatibilities cached-plan 'must not change result type' on PG; PR #4136 CI). repairWorkerSchema only repairs CANONICAL tables, so bespoke tables remain unprotected. The require-table-teardown=0 gate prevents leaks, NOT concurrent shape collisions between files sharing a bespoke table name. Real precondition: RFC 0019 canonical-schema burndown to zero bespoke files (require-canonical-schema-exclude.json still 70). Re-attempt once that hits zero."
---

## Goal

Remove the PG/MySQL test retry once the shared-DB flake class is provably gone:

```ts
// vitest.config.ts
retry: process.env.PG_TEST_URL || process.env.MYSQL_TEST_URL ? 2 : 0,
```

This `retry: 2` exists solely to mask intermittent shared-per-worker-DB
failures (see the comment block above it, ~vitest.config.ts:223-238). PR #3351
(`repairWorkerSchema`) fixes the dominant cause — canonical-table **shape
drift** — systemically. The retry is the masking layer that should come off
once it is no longer needed, so red CI means a real regression again.

## Why this is gated, not immediate

The retry is **broader** than shape drift. Per its own comment it also absorbs:

- leaked **bespoke** tables (raw `createTable` never dropped). These are
  eliminated by the canonical-schema burndown itself (RFC 0019) — converting the
  offending files onto canonical tables so no un-torn-down bespoke table can
  leak — backstopped statically by the `require-table-teardown` ESLint ratchet.
  We deliberately do **not** add a runtime reaper to clean leaked tables: that
  would entrench the divergent (bespoke) path instead of removing it. Fidelity
  goal is zero bespoke tables, not tolerated-and-swept ones.
- `describeIfPg` / `describeIfMysql` backend-only intermittents that SQLite
  never exercises.

Removing it before those are addressed would re-expose unrelated intermittents
and erode trust again.

## Done-when (all required)

1. The bespoke-leak class is gone by construction: no AR `*.test.ts` creates an
   un-torn-down non-canonical table (canonical conversion complete for the
   offending files; `require-table-teardown` exclude list burned to zero), so
   shape drift is the only remaining shared-DB hazard and `repairWorkerSchema`
   already covers it.
2. At least ~5 consecutive green PG **and** MySQL CI runs on `main` with the
   `[schema-repair]` burndown logs showing drift hits trending to zero (or only
   known/tracked tables) — evidence the masked flakes are actually gone, not
   just lucky.
3. Drop the conditional to `retry: 0` (or delete the line), and trim the
   now-stale comment block at vitest.config.ts:223-238.
4. Re-run PG/MySQL CI a few times post-removal to confirm green without retries.

## Out of scope

- The SQLite lane already runs `retry: 0` — no change there.
- Do not weaken assertions or skip tests to make the no-retry run green; a red
  run after removal is a real bug to fix or a real flake to track, by design.
