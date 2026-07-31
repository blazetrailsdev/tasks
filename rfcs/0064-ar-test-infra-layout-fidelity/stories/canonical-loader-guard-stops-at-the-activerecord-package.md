---
title: "canonical-loader guard cannot see a loader moved to another package"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5694
claim: "2026-07-31T00:48:03Z"
assignee: "canonical-loader-guard-stops-at-the-activerecord-package"
blocked-by: null
closed-reason: null
---

## Context

PR #5687 widened `eslint/no-internal-canonical-loaders.test.mjs`'s module-matcher
guard from `packages/activerecord/src/support/` to `activerecordSrcRoot`
(`packages/activerecord/src`, `eslint/test-infra-scope.mjs:19`), closing the hole
where a loader relocated into `test-helpers/` would be invisible.

The scan root is still one package. `isCanonicalSchemaModule`
(`eslint/no-internal-canonical-loaders.mjs:59-67`) matches on module basename
alone, with no package anchoring, so a loader moved to another workspace package
— `packages/activesupport/src/`, a new `packages/ar-test-infra/`, or a top-level
`scripts/` helper — would export a BANNED symbol that no guard case sees, and the
ban would reopen silently exactly as before. This is the same hole a third level
up.

The reason the root stopped at one package is cost: the AR src tree alone is
~1550 `.ts` files and took the in-test time from 125ms to 287ms. A whole-`packages/`
walk needs measuring before it is adopted, and may argue for a different shape
(e.g. asserting the loaders' package location rather than scanning everything).

## Acceptance criteria

- A banned loader exported from a module outside `packages/activerecord/`
  (e.g. `packages/activesupport/src/moved-loader.ts`) fails the guard.
- Verified against a synthetic regression: create the file, confirm the guard
  trips, delete it. A test that passes both before and after is not a guard.
- The `activerecord`-tree cases, the "listed module stopped exporting a banned
  loader" case, and the `nonLoaderBannedExporters` pin all keep passing.
- Runtime stays acceptable for a lint-rule unit test; record the measured cost
  in the PR if the scan root widens again.
