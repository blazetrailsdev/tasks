---
title: "Converge activemodel + arel naming residue and enroll both"
status: done
updated: 2026-09-22
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activemodel", "arel"]
deps: ["naming-receipt-enrollment-gate"]
deps-rfc: []
est-loc: 40
priority: null
pr: trails#7956
claim: "2026-09-22T14:18:16Z"
assignee: "naming-burndown-activemodel-arel"
blocked-by: null
closed-reason: null
---

## Context

RFC 0153 § Design 4 / Rollout, wave W1. Slice: packages/activemodel + packages/arel. Measured on trails `3c6616b0f1` with `pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args:report`; classes from `classifyRow` / `NAMING_CLASSES` in `scripts/api-compare/naming-taxonomy.ts`. Re-measure on your own head before starting.

Inventory at `3c6616b0f1`: **3 convergeable** naming rows in this slice; **6** permanent receipts to place. Files: `attribute-set/builder.ts`, `serialization.ts` (activemodel), `visitors/dot.ts` (arel).

Convergeable rows are never receipted (`permanent: false` in `NAMING_CLASSES`; trails CLAUDE.md § "A documented deviation is debt, not permission"). `burndown` rows rename the TS local/parameter to the camelCased Rails identifier; `module-mixin-receiver` rows rewire to the `this`-typed mixin idiom (trails CLAUDE.md § "Module mixins"). A rename that surfaces a `shape` row converges it in the same PR (`pnpm parity:api:calls:args`). A row whose classification looks wrong is not receipted — file a taxonomy story under 0153.

## Acceptance criteria

- [ ] `pnpm parity:api:calls:args:report` shows 0 `burndown` and 0 `module-mixin-receiver` rows in the slice.
- [ ] Permanent rows in the slice carry `@missingRailsName <id> — PERMANENT`.
- [ ] Adds `activemodel` and `arel` to `NAMING_ENROLLED_PACKAGES`; gate green with both enrolled.
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:params` green; PR body reports the repo-wide convergeable count (RFC §5).
- [ ] Over the LOC ceiling → split by directory into sibling stories under 0153 via `tasks new`; never fan out PRs.
