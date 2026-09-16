---
title: "Receipt permanent naming rows with @missingRailsName and gate enrolled packages"
status: in-progress
updated: 2026-09-16
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activerecord", "i18n", "globalid", "activerecord-test-support"]
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: trails#7845
claim: "2026-09-16T20:30:20Z"
assignee: "naming-receipt-enrollment-gate"
blocked-by: null
closed-reason: null
---

## Context

RFC 0153 step 1 (see its § Design 1–3). Replaces the closed `naming-residue-mark` story, whose counts file (`naming-residue-mark.ts` + `.json`) the RFC amendment in tasks#134 rejected.

`naming` rows in `output/call-arg-mismatches.json` are report-only today (`pnpm parity:api:calls:args:report`). `lint-call-args.ts` gates only `kind: "args"` shape rows (`gatedRows`, `scripts/api-compare/call-args-baseline.ts`; `shardKeyOf`, `call-mismatch-baseline.ts:96`). `@missingRailsArgs` (`scripts/api-compare/missing-rails-args-tags.ts`) keys the Ruby CALL and cannot receipt a single identifier.

Precedents for only-grow enrollment: `GATED_PACKAGES` (`scripts/api-compare/extra-surface-mark.ts:139`, comment at `:42`) and the `unbacked-internal-needs-receipt` `files` lists in `eslint.config.mjs` / `eslint/rails-private-jsdoc.config.mjs`.

Measured on trails `3c6616b0f1` with `pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args:report`; classes from `classifyRow` / `NAMING_CLASSES` in `scripts/api-compare/naming-taxonomy.ts`. Re-measure on your own head before starting. Packages with zero convergeable rows in the AR closure: `i18n` (4 permanent), `globalid` (2), `activerecord-test-support` (0).

## Acceptance criteria

- [ ] `@missingRailsName <ruby_identifier> — PERMANENT|CONVERGEABLE <story-id>` parsed on the shared `missing-rails-call-tags.ts` parser, keyed by the Ruby-side identifier of the differing `ref:` pair, scoped to the enclosing declaration.
- [ ] Missing permanence token → error; bare `CONVERGEABLE` with no story id → error.
- [ ] A receipt on a row `classifyRow` files as `permanent: false` is an error, decided with the mixin-aware arm whenever `thisTypedFunctions` is present (RFC 0153 §2 fallback); unit test that the fallback never rejects a `module-mixin-call` receipt.
- [ ] A receipt keyed on one identifier does not suppress a second naming row on the same call (unit test).
- [ ] `NAMING_ENROLLED_PACKAGES`: one exported constant; in an enrolled package every un-receipted naming row and every stale receipt reds; unenrolled packages are not gated (test pins this). Only-grow guard test.
- [ ] Wired into the `rails-comparison` CI job (fold into `lint-call-args.ts` unless measurement says otherwise — RFC Open question 3). No naming row is ever baselined.
- [ ] Enrolls `i18n`, `globalid`, `activerecord-test-support` with their 6 PERMANENT receipts.
- [ ] Records the forced-vs-warm `thisTypedFunctions` measurement (RFC Open question 4) in the PR body.
- [ ] trails CLAUDE.md § "Before you open the PR" step 2 and CONTRIBUTING.md name the tag and gate.
- [ ] Over the LOC ceiling → ship tag + gate with an empty set; file the docs + three enrollments as a follow-up story under 0153.
