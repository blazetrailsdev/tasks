---
title: "Converge remaining activerecord naming residue and enroll activerecord"
status: done
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activerecord"]
deps: ["naming-receipt-enrollment-gate", "naming-residue-burndown-activerecord-relation"]
deps-rfc: []
est-loc: 200
priority: 13
pr: trails#8022
claim: "2026-09-23T23:57:04Z"
assignee: "naming-burndown-activerecord-remaining"
blocked-by: null
closed-reason: null
---

## Context

RFC 0153 § Design 4 / Rollout, wave W5. Slice: the rest of packages/activerecord. Measured on trails `3c6616b0f1` with `pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args:report`; classes from `classifyRow` / `NAMING_CLASSES` in `scripts/api-compare/naming-taxonomy.ts`. Re-measure on your own head before starting.

Inventory at `3c6616b0f1`: **26 convergeable** naming rows in this slice; **all remaining of activerecord's 47** permanent receipts to place. Includes activerecord's 2 `module-mixin-receiver` rows. `attribute-methods/primary-key.ts` 3, `database-configurations/url-config.ts` 3, `associations.ts` 2, `tasks/database-tasks.ts` 2, then singletons.

Convergeable rows are never receipted (`permanent: false` in `NAMING_CLASSES`; trails CLAUDE.md § "A documented deviation is debt, not permission"). `burndown` rows rename the TS local/parameter to the camelCased Rails identifier; `module-mixin-receiver` rows rewire to the `this`-typed mixin idiom (trails CLAUDE.md § "Module mixins"). A rename that surfaces a `shape` row converges it in the same PR (`pnpm parity:api:calls:args`). A row whose classification looks wrong is not receipted — file a taxonomy story under 0153.

## Acceptance criteria

- [ ] `pnpm parity:api:calls:args:report` shows 0 `burndown` and 0 `module-mixin-receiver` rows in the slice, except the 10 rows re-homed to `naming-rows-recorder-shape-activerecord` (4 recorder misreadings) and `naming-burndown-activerecord-behavioral` (6 behaviour changes). A rename cannot close those rows, and the combined work exceeds the LOC ceiling (trails#8022).
- [ ] Permanent rows in the slice carry `@missingRailsName <id> — PERMANENT`.
- [ ] Enrolling `activerecord` in `NAMING_ENROLLED_PACKAGES` moves to `naming-burndown-activerecord-behavioral`, the story that retires the last convergeable rows.
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:params` green; PR body reports the repo-wide convergeable count (RFC §5).
- [ ] Over the LOC ceiling → split by directory into sibling stories under 0153 via `tasks new`; never fan out PRs.
