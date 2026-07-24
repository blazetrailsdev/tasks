---
title: "infra-re-carveout-audit"
status: ready
updated: 2026-07-24
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
closed-reason: null
---

# Audit remaining scripts/ subtrees for INFRA_RE carve-out

## Context

`INFRA_RE` (`.github/workflows/ci.yml:98`) still treats all of `scripts/` as
cross-cutting except the carved-out set at ci.yml:303
(`tasks|api-compare|test-compare|fixtures-compare|schema-compare|parity`).
Any other scripts/ change still forces EVERY package gate true (full matrix).

Remaining subtrees and their known consumers (verify before carving):

- `scripts/ci/` — `gh-api-retry.sh` used only by the always-on `preflight`
  job (ci.yml:544 etc.); `coverage-summary.mjs` only by the `if: false`
  coverage jobs. Likely safe to carve (preflight always runs regardless).
- `scripts/guides-typecheck/` — consumed by the `guides-typecheck` job
  (ci.yml:584) and self-tested in `unit-tests` (ci.yml:632). Carving requires
  adding it to BOTH `GUIDES_PKGS_RE` (ci.yml:149) and `UNIT_TESTS_PKGS_RE`
  (ci.yml:142).
- `scripts/rails-find/`, `scripts/sync-stats/`, `scripts/phase-g-hunt/`,
  `scripts/fixtures-inventory/`, `scripts/test-deps/` — no CI job consumes
  them (their tests don't run in CI either; see the compare-tests story).
  Candidates for carving with no gate additions.
- `scripts/__fixtures__/` — shared test fixtures; audit which script tests
  import it before carving (it should follow whatever gates its consumers).
- Top-level one-off files (`scripts/*.ts`, `strip-asany`, manifest builders):
  `build-rails-privates-manifest.ts` / `build-rails-file-structure-manifest.ts`
  ARE consumed by rails-comparison (ci.yml:1303, 1317) — if carved they must
  be added to `COMPARISON_RE` (ci.yml:186). `start-worktree.sh`,
  `typecheck.mjs` (used by root `pnpm typecheck` — genuinely cross-cutting,
  keep in infra).

## Acceptance criteria

- Each remaining subtree classified (cross-cutting vs single-consumer vs
  unconsumed) with the consuming job cited.
- Carve-outs implemented for the safe set, with any per-gate regex additions
  so the consuming job still fires on that subtree's changes.
- Trace-script evidence (like the scripts/tasks precedent) that a
  subtree-only diff flips only the intended gates, and the aggregate `ci`
  allowlist remains consistent.
