---
title: "CI: a thor-only diff runs only the Thor tests, the trailties tests that import Thor, and the tree-scanning unit guards"
status: claimed
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 350
priority: 2
pr: null
claim: "2026-09-30T16:55:17Z"
assignee: "generated-app-first-test-run-races-maintain-test-schema-across-workers"
blocked-by: null
closed-reason: null
---

Most of this RFC's PRs touch only `packages/trailties/src/thor/**`, plus the thor rows of the
parity registers. What such a diff triggers today is decided by the `changes` job
(`.github/workflows/ci.yml:57-372`), whose gate rationale is kept in
`scripts/ci-suite-coverage.test.ts` ("Gate reference", `:147`):

- `trailties_affected` (`TRAILTIES_PKGS_RE`, `ci.yml:118`) runs **Trailties Tests**
  (`pnpm vitest run packages/trailties`, the whole package, `:919-932`),
  **virtualized-dx-type-tests** (`:763-778`) and the DX-type step of **leaf-tests** (`:864-903`).
- `unit_tests_affected` (`UNIT_TESTS_PKGS_RE`, which matches every `packages/` path, `:133`) runs
  all of **Unit Tests** (`:779-857`).
- `comparison_affected` (`COMPARISON_RE`, also every `packages/` path) runs all of
  **Rails API/Test Comparison** (`:1616-1971`): `vendor:fetch`, Ruby API and test extraction over
  every vendored source, then about 30 gate steps, each over the whole tree.

The AR, SQLite, PostgreSQL, MySQL, MariaDB, website and guides lanes are already skipped
(`AR_PKGS_RE` and the others do not match `packages/trailties/`).

Constraints the existing gate code documents:

- The `filter` step is one inline `run:` script under GitHub's hard size limit. Crossing the limit
  fails the **whole workflow at startup**, with no checks reported (`ci-suite-coverage.test.ts:150-153`).
  New logic belongs in a checked-in script under `scripts/ci/` (a carved-out subtree,
  `INFRA_CARVEOUT_RE`), not in more inline shell.
- The `ci` aggregator fails on any **unexpectedly skipped** job (`ci.yml:2280-2370`), so every new
  skip needs its arm there.
- `scripts/ci-suite-coverage.test.ts` executes the gate block verbatim and enforces that every
  carved subtree is named in the gate of the job that runs its tests.
- The Thor code imports nothing outside `src/thor/` (the boundary lint from
  `enroll-thor-specs-in-parity-test`), but trailties imports Thor (`generators/base.ts` includes
  `Thor::Actions` since trails#8269). A thor-only diff can therefore break trailties tests, and
  those tests are selected by import, not skipped.

## Design

`scripts/ci/thor-only.sh` (called from the `filter` step) sets `thor_only=true` when **every**
changed path matches the thor-only set:

- `packages/trailties/src/thor/**`;
- `vendor/thor/**`;
- the thor rows of the parity registers: `scripts/parity/unported-files/thor.ts` and the `thor/`
  shards under `scripts/api-compare/*-exclude/` and `*-mark*/`. Measure the exact shard paths when
  implementing.

Any other path, including `INFRA_RE`, leaves `thor_only=false`, and the current gates apply
unchanged. Schedule, workflow_dispatch and push to main never set it.

When `thor_only` is true:

- **Trailties Tests** runs `pnpm vitest related --run <changed thor files>` scoped to
  `packages/trailties`, instead of the whole package. That covers the Thor tests and every
  trailties test importing a changed Thor module.
- **virtualized-dx-type-tests** and the leaf-tests DX step are skipped. Thor has no DX-type surface.
- **Unit Tests** runs only the tree-scanning guards whose result a thor file can change
  (`stale-story-references`, `closing-story-references`, `mixin-declaration-drift`, and any other
  guard over `packages/`). The story lists the ones it keeps, and why each one scans `packages/`.
- The `ci` aggregator's skip arms accept each of these skips only when `thor_only` is true.

## Acceptance criteria

- [ ] `scripts/ci-suite-coverage.test.ts` covers `thor_only`: a thor-only diff, a thor diff plus
      one trailties file (not thor-only), a thor diff plus `pnpm-lock.yaml` (full matrix), and a push
      event (full matrix).
- [ ] The `filter` step grows only by the script call, well under the size limit, and the gate
      reference documents `thor_only`.
- [ ] Before/after wall-clock for one real thor-only PR is recorded in the PR body: the critical
      path and the total billed minutes.
- [ ] No job is skipped for a diff outside the thor-only set. The existing gate tests stay green
      unchanged.

## Definition of done

A `paths-ignore`, or a skip that also applies when a non-thor file changes, does not close this
story.
