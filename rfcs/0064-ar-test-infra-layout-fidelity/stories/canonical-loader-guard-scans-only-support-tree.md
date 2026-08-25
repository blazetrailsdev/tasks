---
title: "canonical-loader guard misses a loader moved out of support/"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5687
claim: "2026-07-30T23:27:18Z"
assignee: "canonical-loader-guard-scans-only-support-tree"
blocked-by: null
closed-reason: null
---

## Context

PR #5657 added a guard test to `eslint/no-internal-canonical-loaders.test.mjs`
that walks `packages/activerecord/src/support/` recursively and fails when a
module exports a symbol in `BANNED` (`loadCanonicalSchema`,
`ensureCanonicalTables`, `loadSchema`) without appearing in
`canonicalLoaderModules` (`eslint/test-infra-scope.mjs`).

The walk is rooted at `support/` only. The rule itself matches on basename at
any path, so a loader relocated OUT of `support/` — most plausibly into
`packages/activerecord/src/test-helpers/`, where the canonical models and
fixtures already live, or to a package root — would not be seen by the guard and
would reopen the ban silently: a banned symbol imported from an unlisted module
is simply not reported. This is the same hole the #5657 review caught one
directory level down (`support/<subdir>/`), just one level up.

`support/` was chosen because `test-infra-scope.mjs` documents the loaders as
living there, and because scanning all of `packages/` costs a full-tree read on
every lint-rule test run. The fix is a scope decision, not a bug: either widen
the root to `packages/activerecord/src` (measure the added runtime first), or
assert explicitly that no module outside `support/` exports a BANNED symbol.

## Acceptance criteria

- A banned loader exported from a module outside `support/` (e.g.
  `packages/activerecord/src/test-helpers/moved-loader.ts`) fails the guard.
- Verified against a synthetic regression — create the file, confirm the guard
  trips, delete it. A test that passes both before and after is not a guard.
- The existing `support/`-tree cases and the converse "listed module stopped
  exporting a banned loader" case keep passing.
- The guard's runtime stays acceptable for a lint-rule unit test; note the
  measured cost in the PR if the scan root widens.
