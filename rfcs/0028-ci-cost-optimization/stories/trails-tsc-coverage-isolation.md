---
title: "Collect trails-tsc coverage without voiding the shared run"
status: done
updated: 2026-06-22
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 20
pr: 3925
claim: "2026-06-22T20:59:15Z"
assignee: "trails-tsc-coverage-isolation"
blocked-by: null
---

## Context

PR #3540 wired reporting-only vitest v8 coverage for non-AR packages but
**excluded `packages/trails-tsc`** from both the coverage test run and the
coverage denominator (`COVERAGE_EXCLUDE` in `vitest.config.ts`, and the
`coverage` job package list in `.github/workflows/ci.yml`).

Reason: trails-tsc's watcher/build tests (`watch-views.test.ts`,
`build-views.test.ts`, `lsp-plugin.test.ts`) spawn subprocesses that are
coverage-hostile under load — with v8 instrumentation they reliably trip
vitest's `Timeout calling "onTaskUpdate"` worker-RPC error, which aborts the
whole run and writes NO coverage report, voiding every other package's numbers.

So trails-tsc is the one non-AR package with no coverage signal.

## Acceptance criteria

- Make trails-tsc coverage-collectable without risking the shared coverage run:
  EITHER give it its own dedicated non-blocking coverage step/job (isolated, so
  a worker-RPC timeout can't void other packages), OR stabilize the
  subprocess-spawning tests under instrumentation (e.g. bump worker-RPC/test
  timeouts, reduce fork pressure for that package).
- Re-include `packages/trails-tsc` in `COVERAGE_INCLUDE`/denominator once stable.
- Still reporting-only — no threshold gate.

## Reference

- Exclusion: `vitest.config.ts` `COVERAGE_EXCLUDE` (`packages/trails-tsc/**`).
- Coverage job: `.github/workflows/ci.yml` `coverage`.
- Failure mode observed: `Timeout calling "onTaskUpdate"` under host load.
