---
title: "Remove PG/MySQL test retry:2 once shared-DB flake class is provably gone"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: ["extend-schema-repair-reap-leaked-bespoke-tables"]
deps-rfc: []
est-loc: 20
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

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

- leaked **bespoke** tables (raw `createTable` never dropped) — tracked
  separately in `extend-schema-repair-reap-leaked-bespoke-tables`;
- `describeIfPg` / `describeIfMysql` backend-only intermittents that SQLite
  never exercises.

Removing it before those are addressed would re-expose unrelated intermittents
and erode trust again.

## Done-when (all required)

1. `extend-schema-repair-reap-leaked-bespoke-tables` has landed (bespoke-leak
   class also fixed, not just shape drift).
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
