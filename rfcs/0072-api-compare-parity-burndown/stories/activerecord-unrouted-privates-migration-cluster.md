---
title: "Route migration.ts's unrouted Rails privates (executeBlock, compatibleTableDefinition)"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6182
claim: "2026-08-07T17:05:48Z"
assignee: "activemodel-time-readers-take-rational-sec-fraction-value"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-unrouted-privates-tasks-and-migration` on 2026-08-07,
which named two remaining clusters and said "one PR per cluster". That story now
owns only the `tasks/database-tasks.ts` cluster; this one owns `migration.ts`.

Verified on `origin/main` (311bff350). Five Rails privates from
`vendor/rails/activerecord/lib/active_record/migration.rb` exist at their Rails
names in `packages/activerecord/src/migration.ts` but are not all routed:

- `executeMigrationInTransaction` (migration.ts:2515) — routed
  (callers at :2439, :2452).
- `ddlTransaction` (migration.ts:2847) — routed (caller at :2815).
- `recordVersionStateAfterMigrating` (migration.ts:2547) — routed
  (caller at :2817).
- `executeBlock` (migration.ts:1643) — **unrouted**. The only other reference in
  the package is the method-name list in
  `migration/command-recorder.ts:690`; no body calls it.
  (`owner.ts:47,59`'s `executeBlocks` is an unrelated test model.)
- `compatibleTableDefinition` (migration.ts:1383) — **unrouted**. No caller
  anywhere in `packages/activerecord/src`.

So the residual work here is the last two, plus confirming the three routed ones
call what the Ruby body calls rather than merely existing at the right name.

## The shape that worked

From the parent story, and confirmed for `tasks/database-tasks.ts`: the
Rails-named private is often already present as a **dead** function while the
live code sits behind an invented `_xxx` name. Check for that pattern before
assuming the private is genuinely missing — the fix is to rename the live
method to the Rails name, point every caller at it, and delete the dead shim.

Rails source: `vendor/rails/activerecord/lib/active_record/migration.rb`
(`execute_block`, `compatible_table_definition`,
`execute_migration_in_transaction`, `ddl_transaction`,
`record_version_state_after_migrating`).

## Acceptance criteria

- [ ] `executeBlock` and `compatibleTableDefinition` are routed: every internal
      caller of the behaviour goes through the Rails-named member, and any
      invented shim standing in for them is deleted. If the Rails body genuinely
      has no caller in the ported subset, say so at the call site rather than
      leaving a dead export.
- [ ] The three already-routed privates are checked body-for-body against
      `migration.rb`; any call the Ruby body makes and the TS body does not is
      converged, not baselined.
- [ ] Run `API_COMPARE_FORCE=1 pnpm parity:api --wide-calls` before
      `pnpm parity:api:calls`; converged wide-baseline rows are deleted by hand
      (only-shrink — never `--write`).
- [ ] Single PR from `main`, under the LOC ceiling, no overlap with the
      `tasks/database-tasks.ts` cluster.
