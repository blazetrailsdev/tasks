---
title: "Make every script, lint rule, config and CI glob accept lib/ + test/ beside src/"
status: claimed
updated: 2026-11-06
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: layout-tooling
packages: [scripts]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-06T14:52:38Z"
assignee: "lib-test-layout-tooling-prep"
blocked-by: null
---

## Context

The RFC README's "Inventory" section lists every assumption (124 files in
`scripts/`, 54 in `eslint/`, `.github/workflows/ci.yml`, `vitest.config.ts`,
`eslint.config.mjs`, tsconfigs, package.json). Key sites:
`scripts/api-compare/ts-file-walk.ts:6-8,37-40,141-156`,
`scripts/test-compare/extract-ts-tests.ts:62-74`,
`vitest.config.ts` project `include`s and AR adapter excludes,
`.github/workflows/ci.yml` `changes` regexes and `packages/*/src` steps.

## Acceptance criteria

- [ ] One helper (e.g. `scripts/layout/package-roots.ts`) answers, per package,
      its library root (`src` or `lib`) and test roots (`src` or `test`);
      api-compare's `packageSrcDir`, `walkPackageTsFiles` and test-compare's
      `getPackageTestFiles` read it. No output changes on main today. The rest
      of the inventory is `lib-test-layout-tooling-inventory-rest`.
- [ ] `scripts/layout/plan-test-moves.ts <pkg> [--apply]` prints and applies
      the `old → new` table by the RFC's "Where a test lands" rules, using the
      test-compare manifest; covered by a unit test on a fixture package.
- [ ] `scripts/layout/src-references.ts [<pkg>]` lists every repo reference to
      `packages/<pkg>/src` outside the tasks repo; used as each package PR's
      done-check.
- [ ] `scripts/layout/server-path-closure.ts` walks each package's built
      `dist/` import graph from `.` and every non-testing export and fails on a
      testing module, a vitest import or a `test/` path; runs in CI with an
      only-shrink list of today's violations, each row naming the story filed
      for its root import edge.
- The throwaway-move verification moved to
  `lib-test-layout-tooling-inventory-rest`, since it needs the whole inventory
  wired (scope split on trails#9785, 2026-11-06).
