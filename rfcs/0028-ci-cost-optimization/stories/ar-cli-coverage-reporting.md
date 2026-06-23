---
title: "Add reporting-only coverage for activerecord-cli"
status: claimed
updated: 2026-06-23
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-23T10:45:43Z"
assignee: "ar-cli-coverage-reporting"
blocked-by: null
---

## Context

PR #3897 (story ar-sqlite-lane-coverage-reporting) added reporting-only v8
coverage for `activerecord` via a separate non-blocking `ar-sqlite-coverage`
job. It deliberately omitted `activerecord-cli`: the AR coverage run is scoped
to `packages/activerecord/src/**` (via `AR_COVERAGE=1` in `vitest.config.ts`),
and the cli vitest run was left out of the coverage job because a second
`pnpm vitest run` against the same `./coverage` dir would clobber the report.

`activerecord-cli` is now the only AR-family package with no coverage number.

## Acceptance criteria

- Collect reporting-only coverage for `activerecord-cli` without clobbering the
  `activerecord` report — either merge both into one v8 report (e.g. a single
  vitest invocation covering both, or `--coverage.reportsDirectory` + a merge
  step) or publish a second artifact/summary section.
- Keep it non-blocking: no `thresholds`, off the `ci` aggregator `needs:` graph,
  `continue-on-error`.
- Reuse `scripts/ci/coverage-summary.mjs` for the run-UI summary.

## Reference

- `vitest.config.ts` `AR_COVERAGE` gate + `COVERAGE_INCLUDE`/`COVERAGE_EXCLUDE`.
- `.github/workflows/ci.yml` `ar-sqlite-coverage` job.
