---
title: "Converge activerecord connection-adapters naming residue"
status: done
updated: 2026-09-23
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activerecord"]
deps: ["naming-receipt-enrollment-gate"]
deps-rfc: []
est-loc: 150
priority: 11
pr: trails#8005
claim: "2026-09-23T17:18:15Z"
assignee: "naming-residue-burndown-activesupport"
blocked-by: null
closed-reason: null
---

## Context

RFC 0153 § Design 4 / Rollout, wave W3. Slice: packages/activerecord/src/connection-adapters/\*\*. Measured on trails `3c6616b0f1` with `pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args:report`; classes from `classifyRow` / `NAMING_CLASSES` in `scripts/api-compare/naming-taxonomy.ts`. Re-measure on your own head before starting.

Inventory at `3c6616b0f1`: **26 convergeable** naming rows in this slice; **some of activerecord's 47 (those whose sites are in this slice)** permanent receipts to place. abstract and postgresql `schema-statements.ts` 4 each, `abstract/database-statements.ts` 3, then singletons. Run the per-adapter CI lanes.

Convergeable rows are never receipted (`permanent: false` in `NAMING_CLASSES`; trails CLAUDE.md § "A documented deviation is debt, not permission"). `burndown` rows rename the TS local/parameter to the camelCased Rails identifier; `module-mixin-receiver` rows rewire to the `this`-typed mixin idiom (trails CLAUDE.md § "Module mixins"). A rename that surfaces a `shape` row converges it in the same PR (`pnpm parity:api:calls:args`). A row whose classification looks wrong is not receipted — file a taxonomy story under 0153.

## Acceptance criteria

- [ ] `pnpm parity:api:calls:args:report` shows 0 `burndown` and 0 `module-mixin-receiver` rows in the slice.
- [ ] Permanent rows in the slice carry `@missingRailsName <id> — PERMANENT`.
- [ ] Enrolls nothing (activerecord enrolls at W5).
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:params` green; PR body reports the repo-wide convergeable count (RFC §5).
- [ ] Over the LOC ceiling → split by directory into sibling stories under 0153 via `tasks new`; never fan out PRs.
