---
title: "run-eslint-rule-tests-in-ci"
status: closed
updated: 2026-07-28
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered on main. eslint/ is now in UNIT_TESTS_PKGS_RE (ci.yml:210) and in the unit-tests job's vitest filters (ci.yml:714), and all eslint/*.test.mjs entries are gone from KNOWN_UNRUN in scripts/ci-suite-coverage.test.ts (only vendor/fetch.test.ts remains). All three acceptance criteria are satisfied."
---

# ESLint rule tests (eslint/\*.test.mjs) never run — 22 files of dead signal

## Context

`vitest.config.ts` includes `eslint/*.test.mjs` in the "other" project, but
`pnpm vitest run eslint` reports "No test suite found in file ..." for 18 of
the 22 files: they drive ESLint's `RuleTester`, which calls the global
`describe`/`it` it expects the host runner to supply, and vitest's globals are
off in this config. So the custom-rule suites for `no-raw-sql`,
`rails-error-parity`, `require-table-teardown`, etc. are dead signal — no CI
job runs them either (see `scripts/ci-suite-coverage.test.ts`'s KNOWN_UNRUN,
added by the compare-script-tests-in-ci PR).

Fix is likely `RuleTester.describe = describe; RuleTester.it = it` in a shared
setup file for these suites (ESLint exposes those static hooks), then wiring
`eslint` into the `unit-tests` job's vitest invocation in
`.github/workflows/ci.yml`.

## Acceptance criteria

- `pnpm vitest run eslint` passes with all 22 files reporting real tests
  (no "No test suite found").
- `eslint` is added to the `unit-tests` job's `pnpm vitest run` filters and
  `eslint/` is added to `UNIT_TESTS_PKGS_RE` in `.github/workflows/ci.yml`.
- The corresponding `eslint/*.test.mjs` entries are deleted from `KNOWN_UNRUN`
  in `scripts/ci-suite-coverage.test.ts` (its third test fails if a stale
  entry is left behind).
