---
title: "Run trails-tsc unit tests in a blocking CI job"
status: in-progress
updated: 2026-07-20
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4996
claim: "2026-07-20T18:31:11Z"
assignee: "trails-tsc-blocking-test-gate"
blocked-by: null
---

## Context

Discovered while shipping `trails-tsc-coverage-isolation` (PR #3925): **no
blocking CI job runs `packages/trails-tsc/**/\*.test.ts`**. The shared non-AR
`coverage` job lists packages explicitly and omits trails-tsc
(`.github/workflows/ci.yml:711-723`); `leaf-tests` runs rack/actionview/
tse-compiler only (`ci.yml:641-649`); `unit-tests` runs arel/activemodel/
activesupport/guides/tasks (`ci.yml:600-606`); `virtualized-dx-type-tests`runs`pnpm test:types:virtualized` (type-level, not the runtime unit tests).

PR #3925 added a `trails-tsc-coverage` job, but it is `continue-on-error: true`

- `dangerouslyIgnoreUnhandledErrors` (reporting-only, per that story's
  acceptance criteria), so a real `expect` failure in `build-views.test.ts`,
  `watch-views.test.ts`, `lsp-plugin.test.ts`, `tse.test.ts`, etc. is visible but
  does NOT block merge. So trails-tsc's runtime unit tests currently have no
  enforcing gate.

The hard part is the same coverage-hostility that motivated the isolation
story: these tests spawn subprocesses / run heavy `tsc` compiles that trip
vitest's `onTaskUpdate` worker-RPC timeout under load. A blocking job must
stabilize that (e.g. `TRAILS_TEST_FORKS=1`, bumped `--test-timeout`, no v8
instrumentation — instrumentation is what tips it over) so the RPC timeout
can't produce a false-negative merge block.

## Acceptance criteria

- `packages/trails-tsc/**/*.test.ts` run in a blocking CI job (NOT
  `continue-on-error`), gated on `trails_tsc_affected || tse_compiler_affected`.
- The job is stable under load (no `onTaskUpdate` flake) WITHOUT v8 coverage —
  run plain (no `--coverage`), so the RPC-timeout pressure that forced the
  reporting-only posture on the coverage job is absent.
- A genuine test failure fails the job (do not carry over
  `dangerouslyIgnoreUnhandledErrors` / `continue-on-error` from the coverage
  job; those exist only because that job is reporting-only).
- Wire into the `ci` all-jobs gate's expected-skip allow-list so a legitimate
  skip (no trails-tsc/tse-compiler change) doesn't trip it.
