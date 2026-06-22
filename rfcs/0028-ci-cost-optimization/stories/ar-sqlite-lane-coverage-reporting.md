---
title: "ar-sqlite-lane-coverage-reporting"
status: done
updated: 2026-06-22
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 20
pr: 3897
claim: "2026-06-22T17:14:05Z"
assignee: "ar-sqlite-lane-coverage-reporting"
blocked-by: null
---

## Context

PR #3540 wired reporting-only vitest v8 coverage into CI for the light (non-AR)
packages only. activerecord / activerecord-cli are excluded from that baseline
(`packages/activerecord/**` is in `COVERAGE_EXCLUDE` in `vitest.config.ts`)
because the AR suite forks 6 workers and dominates CI time.

AR coverage is the single most valuable number we're currently missing. This
story adds it as **reporting-only** (no gate), on the **sqlite lane only** (the
cheapest of sqlite/postgres/mysql/maria) to bound CI cost.

## Acceptance criteria

- Drop `packages/activerecord/**` (and optionally `activerecord-cli`) from the
  coverage exclude, OR scope a dedicated include for the AR coverage run.
- Add `--coverage` (reporting-only, no thresholds) to the **sqlite-tests** lane
  only — NOT postgres/mysql/maria. Keep `continue-on-error`-style non-blocking
  semantics; do not add AR coverage to the `ci` aggregator `needs:`.
- Publish AR coverage to the run UI step summary (reuse
  `scripts/ci/coverage-summary.mjs`) and upload lcov/json artifacts.
- Measure the CI-minute delta the `--coverage` flag adds to the sqlite lane and
  note it in the PR; if it materially slows the critical path, move AR coverage
  to its own separate non-blocking job instead of bolting onto sqlite-tests.
- Still NO failing threshold gate.

## Reference

- Coverage config: `vitest.config.ts` `test.coverage` + `COVERAGE_EXCLUDE`.
- sqlite lane: `.github/workflows/ci.yml` `sqlite-tests` job.
- Summary script: `scripts/ci/coverage-summary.mjs`.
