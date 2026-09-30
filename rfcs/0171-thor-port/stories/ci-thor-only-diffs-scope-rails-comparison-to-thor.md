---
title: "CI: a thor-only diff runs Rails API/Test Comparison for the thor package only"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["ci-thor-only-diffs-run-minimal-test-lanes"]
deps-rfc: []
est-loc: 450
priority: 2
pr: null
claim: null
assignee: null
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

The comparison job is the long pole for a thor-only diff. It fetches and extracts every vendored
source (`vendor:fetch`, `extract-ruby-api.rb`, `extract-ruby-tests.rb`) and runs every ratchet over
every package. Under `thor_only`:

- fetch and extract only the `thor` source (`LIB_PATHS_JSON` / `TEST_PATHS_JSON` filtered to
  `thor`; `vendor:fetch` of the one source);
- run `compare.ts --package thor` and `parity:test` for the thor block;
- run each ratchet in its per-package mode where it has one (`--package thor`). A ratchet that only
  reads the global artifact either gains a per-package mode, **filtering the committed marks to
  the thor rows so no other package reads as STALE**, or keeps running unscoped. The story
  measures each of the ~30 steps and records which of the two it takes.

## Fidelity traps (predicted at authoring)

- [ ] **Partial artifacts vs global ratchets.** A ratchet fed an artifact that contains only thor
      rows must not read the other packages' missing rows as "converged, tighten". That is the STALE
      row failure mode CLAUDE.md warns about for stale artifacts. Every scoped ratchet asserts that
      its artifact's package set matches its `--package`.
- [ ] **`receipt-audit --package activerecord --gate`** and other activerecord-only steps are
      skipped under `thor_only`, as nothing they read can change.
- [ ] **The pseudo-package** has no `packages/thor` directory. The scoped extractors resolve thor's
      TS root through `PACKAGE_DIR_OVERRIDES` / `PACKAGE_SRC_SUBDIR`.

## Acceptance criteria

- [ ] A thor-only diff's comparison job extracts and compares only thor, and each gate step is
      either scoped or listed as unscoped with the reason.
- [ ] A seeded thor regression (a deleted ported method, an extra public name) still reds the
      scoped job, and a non-thor diff runs the job exactly as today.
- [ ] Before/after wall-clock for the job is recorded in the PR body.
