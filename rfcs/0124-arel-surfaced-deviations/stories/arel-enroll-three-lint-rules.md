---
title: "arel: enroll rails-error-parity (with arel in the manifest) and no-explicit-any-disable"
status: done
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: lint-enrollment
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7131
claim: "2026-08-27T18:46:13Z"
assignee: "arel-enroll-three-lint-rules"
blocked-by: null
closed-reason: null
---

## Context

Two custom ESLint rules run on other packages but not on `packages/arel`,
and each reports zero (or one) violation there today, so enrollment is a
free tightening.

(A third, `blazetrails/unbacked-internal-needs-receipt`, was originally part of
this story. Its "reports 0" premise was measured against an empty
`eslint/rails-private-methods.json`; with the real manifest arel has 9
violations that collide with the RFC 0117 extra-surface ratchet, so it moved to
`arel-enroll-unbacked-internal-receipt`.)

1. `blazetrails/rails-error-parity` — enrollment at `eslint.config.mjs:404-411`.
   The manifest builder `scripts/build-rails-error-manifest.ts:24` has
   `PACKAGES = ["activerecord","activemodel","activesupport"]` and its `PKG_NS`
   comment explicitly leaves `lib/arel` out, so `eslint/rails-error-classes.json`
   mentions arel 0 times. Add `arel` with namespace `arel/` (the three classes
   in `vendor/rails/activerecord/lib/arel/errors.rb`: `ArelError`,
   `EmptyJoinError`, `BindError`), regenerate the manifest, enroll
   `packages/arel/src/**/*.ts`. The audit verified all 15 `raise` sites in
   `lib/arel/` already throw the matching class from `packages/arel/src/errors.ts`,
   so this should land green.
2. `blazetrails/no-explicit-any-disable` — activerecord-only at
   `eslint.config.mjs:762`. arel has one file-level
   `/* eslint-disable @typescript-eslint/no-explicit-any */` at
   `packages/arel/src/node-slots.ts:21`; narrow the slot ctor types to
   `unknown`-based signatures (or carry the reviewed receipt the rule accepts)
   and enroll.

## Acceptance criteria

- `packages/arel/src/**/*.ts` is in the `files` list for both rules.
- `scripts/build-rails-error-manifest.ts` scans `arel` and
  `eslint/rails-error-classes.json` lists its error classes.
- `node-slots.ts` has no `no-explicit-any` disable.
- `pnpm eslint packages/arel/src --max-warnings 0` exits 0; no baseline or
  exclude row added.
