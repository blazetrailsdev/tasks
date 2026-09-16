---
title: "Converge activesupport naming residue and enroll it"
status: draft
updated: 2026-09-16
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activesupport"]
deps: ["naming-receipt-enrollment-gate"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0153 § Design 4 / Rollout, wave W2. Slice: packages/activesupport. Measured on trails `3c6616b0f1` with `pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args:report`; classes from `classifyRow` / `NAMING_CLASSES` in `scripts/api-compare/naming-taxonomy.ts`. Re-measure on your own head before starting.

Inventory at `3c6616b0f1`: **17 convergeable** naming rows in this slice; **14** permanent receipts to place. Includes 2 `module-mixin-receiver` rows. Densest file `values/time-zone.ts` (4); rest are singletons across cache, message-pack, testing, core-ext.

Convergeable rows are never receipted (`permanent: false` in `NAMING_CLASSES`; trails CLAUDE.md § "A documented deviation is debt, not permission"). `burndown` rows rename the TS local/parameter to the camelCased Rails identifier; `module-mixin-receiver` rows rewire to the `this`-typed mixin idiom (trails CLAUDE.md § "Module mixins"). A rename that surfaces a `shape` row converges it in the same PR (`pnpm parity:api:calls:args`). A row whose classification looks wrong is not receipted — file a taxonomy story under 0153.

## Acceptance criteria

- [ ] `pnpm parity:api:calls:args:report` shows 0 `burndown` and 0 `module-mixin-receiver` rows in the slice.
- [ ] Permanent rows in the slice carry `@missingRailsName <id> — PERMANENT`.
- [ ] Adds `activesupport` to `NAMING_ENROLLED_PACKAGES`; gate green.
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:params` green; PR body reports the repo-wide convergeable count (RFC §5).
- [ ] Over the LOC ceiling → split by directory into sibling stories under 0153 via `tasks new`; never fan out PRs.
