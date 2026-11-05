---
title: "Make every script, lint rule, config and CI glob accept lib/ + test/ beside src/"
status: draft
updated: 2026-11-05
rfc: "0000-package-layout-mirrors-a-rails-gem"
cluster: layout-tooling
packages: [scripts]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
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
      its library root (`src` or `lib`) and test roots (`src` or `test`); every
      inventoried script, eslint rule, config and CI step reads it or a glob
      covering both layouts. No output changes on main today.
- [ ] `scripts/layout/plan-test-moves.ts <pkg> [--apply]` prints and applies
      the `old → new` table by the RFC's "Where a test lands" rules, using the
      test-compare manifest; covered by a unit test on a fixture package.
- [ ] `scripts/layout/src-references.ts [<pkg>]` lists every repo reference to
      `packages/<pkg>/src` outside the tasks repo; used as each package PR's
      done-check.
- [ ] A throwaway local move of a small package (not committed) shows
      `pnpm parity:api`, `parity:test`, all ratchet gates, lint and
      `ci-suite-coverage` unchanged.
