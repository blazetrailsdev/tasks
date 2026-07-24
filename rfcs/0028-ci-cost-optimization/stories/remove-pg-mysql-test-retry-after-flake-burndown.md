---
title: "Remove PG/MySQL test retry:2 once shared-DB flake class is provably gone"
status: ready
updated: 2026-07-24
rfc: "0028-ci-cost-optimization"
cluster: null
deps:
  - fix-hot-compatibilities-pg-cached-plan-flake
  - fix-transaction-isolation-id-reflection-race
deps-rfc: []
est-loc: 20
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
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

- **bespoke tables that drift under the shared per-worker DB.** These are NOT
  just leaks — the offenders here (`hot_compatibilities`,
  `transaction-isolation`'s `Tag`/`tags`) tear down correctly and are
  `require-table-teardown`-clean, yet still fail intermittently on PG/MariaDB
  because `repairWorkerSchema` repairs **canonical** tables only, so a bespoke
  table's shape/plan-cache/reflection state can still race across the workers
  sharing a DB. **The `require-canonical-schema-exclude.json`/
  `require-table-teardown` ratchets reaching zero does NOT close this class** —
  those are static, and this is a runtime hazard. (This was the original
  mis-specification: PR #4136 removed the retry with those ratchets already at
  zero and both `hot_compatibilities` and `defaults` promptly drifted, forcing a
  revert.) The real gate is the two blocker stories below.
- `describeIfPg` / `describeIfMysql` backend-only intermittents that SQLite
  never exercises.

Removing it before those are addressed would re-expose unrelated intermittents
and erode trust again.

## Blockers (must land first)

Confirmed on CI run 30060420840 (PR #5205, the first PG/MariaDB runs with the
shared-DB retry actually removed):

- `fix-hot-compatibilities-pg-cached-plan-flake` — PG `0A000`
  `plancache.c`/`RevalidateCachedQuery` on `hot_compatibilities` (same failure
  that reverted #4136).
- `fix-transaction-isolation-id-reflection-race` —
  `MissingAttributeError: can't write unknown attribute 'id'` on PG **and**
  MariaDB in `TransactionIsolationTest > read uncommitted` / `> repeatable read`.

These are wired as `deps`; this story cannot be worked until both are done.

## Done-when (all required)

1. Both blocker stories are **done**: `fix-hot-compatibilities-pg-cached-plan-flake`
   and `fix-transaction-isolation-id-reflection-race`. These are the two
   _runtime_ bespoke-table hazards `repairWorkerSchema` does not cover; the
   static ratchets being at zero is necessary but NOT sufficient (see #4136).
   If a further bespoke-drift failure surfaces on the no-retry run, file it as a
   new blocker and add it to `deps` rather than restoring the retry.
2. At least ~5 consecutive green PG **and** MariaDB (the MySQL-family stand-in
   lane; `mysql-tests` is parked) CI runs on `main` **with `retry: 0` already in
   effect** — i.e. green because the flakes are gone, not because a retry
   re-ran. (Green runs that still had `retry: 2` are not evidence.)
3. Drop the conditional to `retry: 0` (or delete the line), and trim the
   now-stale comment block above the `retry:` line in `vitest.config.ts`.
4. Re-run PG/MariaDB CI a few times post-removal to confirm green without
   retries.

## Out of scope

- The SQLite lane already runs `retry: 0` — no change there.
- Do not weaken assertions or skip tests to make the no-retry run green; a red
  run after removal is a real bug to fix or a real flake to track, by design.
