---
title: "arel: enroll unbacked-internal-needs-receipt, rails-error-parity (with arel in the manifest) and no-explicit-any-disable"
status: claimed
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: lint-enrollment
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-08-27T18:46:13Z"
assignee: "arel-enroll-three-lint-rules"
blocked-by: null
closed-reason: null
---

## Context

Three custom ESLint rules run on other packages but not on `packages/arel`,
and each reports zero (or one) violation there today, so enrollment is a
free tightening:

1. `blazetrails/unbacked-internal-needs-receipt` (RFC 0121) — enrollment set
   at `eslint.config.mjs:377-390` (must stay in sync with
   `eslint/rails-private-jsdoc.config.mjs`). With the rule's own ignores
   (`**/*.test.ts`, `**/test-helpers/**`) a dry run on `packages/arel/src`
   reports 0. activerecord joined in #7115; arel is the next package.
2. `blazetrails/rails-error-parity` — enrollment at `eslint.config.mjs:404-411`.
   The manifest builder `scripts/build-rails-error-manifest.ts:24` has
   `PACKAGES = ["activerecord","activemodel","activesupport"]` and its `PKG_NS`
   comment explicitly leaves `lib/arel` out, so `eslint/rails-error-classes.json`
   mentions arel 0 times. Add `arel` with namespace `arel/` (the three classes
   in `vendor/rails/activerecord/lib/arel/errors.rb`: `ArelError`,
   `EmptyJoinError`, `BindError`), regenerate the manifest, enroll
   `packages/arel/src/**/*.ts`. The audit verified all 15 `raise` sites in
   `lib/arel/` already throw the matching class from `packages/arel/src/errors.ts`,
   so this should land green.
3. `blazetrails/no-explicit-any-disable` — activerecord-only at
   `eslint.config.mjs:762`. arel has one file-level
   `/* eslint-disable @typescript-eslint/no-explicit-any */` at
   `packages/arel/src/node-slots.ts:21`; narrow the slot ctor types to
   `unknown`-based signatures (or carry the reviewed receipt the rule accepts)
   and enroll.

## Acceptance criteria

- `packages/arel/src/**/*.ts` is in the `files` list for all three rules (and
  in `eslint/rails-private-jsdoc.config.mjs` for rule 1).
- `scripts/build-rails-error-manifest.ts` scans `arel` and
  `eslint/rails-error-classes.json` lists its three classes.
- `node-slots.ts` has no `no-explicit-any` disable.
- `pnpm eslint packages/arel/src --max-warnings 0` exits 0; no baseline or
  exclude row added.
