---
title: "compare-script-tests-in-ci"
status: claimed
updated: 2026-07-24
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-24T20:06:52Z"
assignee: "compare-script-tests-in-ci"
blocked-by: null
closed-reason: null
---

# Compare-tooling unit tests never run in CI — wire them into a gated job

## Context

`vitest.config.ts:420-430` includes script test suites in the non-AR project:
`scripts/api-compare/*.test.ts` (22 files), `scripts/test-compare/*.test.ts`
(10), `scripts/fixtures-compare/*.test.ts`, `scripts/schema-compare/*.test.ts`,
`scripts/parity/**/*.test.ts`, `scripts/test-deps/*.test.ts`,
`scripts/rails-find/*.test.ts`, `scripts/strip-asany.test.ts`,
`scripts/rails-file-structure-mixins.test.ts`.

But no CI job ever invokes them: every `pnpm vitest run` in
`.github/workflows/ci.yml` passes explicit path filters, and the only script
paths listed are `scripts/guides-typecheck` and `scripts/tasks` in the
`unit-tests` job (ci.yml:625-633). The `rails-comparison` job (ci.yml:1217)
runs the tools via `tsx`, not their unit tests. So ~40 test files are
local-only signal.

Note: the INFRA_RE carve-out (ci.yml:284-303) did not change this — these
tests didn't run under the full matrix either.

## Acceptance criteria

- The compare/parity/misc script test suites run in CI, gated on their own
  subtrees changing (extend `UNIT_TESTS_PKGS_RE` at ci.yml:142 or add the
  paths to the `rails-comparison` job, whichever keeps cost proportional —
  running them inside rails-comparison naturally rides `comparison_affected`).
- Gates stay consistent: the job that runs a suite fires whenever that
  suite's source dir changes (cross-check with the `infra_files` carve-out at
  ci.yml:303 so a carved-out dir still gets its tests run).
- The aggregate `ci` skip allowlist stays consistent with any new/changed
  job condition.
