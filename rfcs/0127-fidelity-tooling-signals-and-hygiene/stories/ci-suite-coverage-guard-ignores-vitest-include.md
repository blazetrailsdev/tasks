---
title: "ci-suite-coverage passes a test file no vitest project collects"
status: draft
updated: 2026-09-30
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/ci-suite-coverage.test.ts` checks that every tooling test file under `scripts/`, `eslint/` and `vendor/` is covered by some `pnpm vitest run <filter>` in `.github/workflows/ci.yml` (`ciVitestFilters`). It never checks that a vitest project actually collects the file. Collection is governed by each project's `include` globs in `vitest.config.ts`; the "other" project lists `scripts/*.test.ts`, `scripts/api-compare/*.test.ts`, `eslint/*.test.mjs` and so on.

Observed on trails#8289 (2026-09-30):

- I added `scripts/ci/bg-gates.test.mjs` and registered it in the unit-tests filter list.
- `ci-suite-coverage.test.ts` passed.
- `pnpm vitest run scripts/ci/bg-gates.test.mjs` collected nothing, because no project `include` matched `scripts/ci/*.test.mjs`.

The file would have been reported as "run in CI" while never running. The PR fixed it by adding `"scripts/ci/*.test.mjs"` to the other project's `include`, but the guard itself still has the hole. Any new test directory under `scripts/` (or a new extension) repeats it.

## Acceptance criteria

- `ci-suite-coverage.test.ts` fails for a tooling test file that no vitest project's `include` (minus its `exclude`) matches, even when a CI filter covers it. Resolve the globs from `vitest.config.ts` itself, not a copied list.
- A regression case in the suite shows a filter-covered but uncollected file failing. It must fail on the pre-fix guard.
- Every currently committed tooling test file still passes. If any turns out to be uncollected today, fix its `include` in the same PR and list it in the PR body.
