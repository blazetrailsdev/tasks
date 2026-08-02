---
title: "defer-more-jobs-out-of-pre-ready"
status: ready
updated: 2026-08-02
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

## Context

Review now happens while a PR is a draft; the expensive PG/MariaDB suites
already defer to `ready_for_review` (`.github/workflows/ci.yml:20-30`,
`:1071-1078` postgres-tests, `:1322-1332` maria-tests, aggregate skip
allow-list at `:1866-1875` via `DB_ADAPTERS_DRAFT_DEFERRED` at `:1868`).

An audit of every job in `ci.yml` against measured durations from four recent
PR runs found one unambiguous next-tier candidate:

- `guides-typecheck` (`ci.yml:628-643`), gate `guides_affected` built from
  `GUIDES_PKGS_RE` (`ci.yml:200-204`). It runs `pnpm build` + `pnpm
guides:typecheck`, which compiles fenced TS blocks in
  `packages/website/docs/guides/**`. Measured 39-83s per run and it fires on
  essentially every non-test-only AR/activemodel/activesupport/arel source PR.
  Its result is a docs-compile merge gate: a reviewer of a package-source diff
  does not act on it during draft review, and a broken guide is equally
  fixable at ready time.

Everything else pre-ready either is the reviewer's actual signal
(`sqlite-tests` ~575s, `unit-tests` ~200s, `rails-comparison` ~180s fidelity
ratchets, `lint` ~150s, `build-and-typecheck`) or is already label/`if: false`
gated (parity suites, coverage jobs, `mysql-tests`, `sqlite-mem-tests`,
`maria-prepared-tests`).

## Acceptance criteria

- `guides-typecheck` gains the same draft carve-out shape the DB suites use:
  runs on non-PR events, on non-draft PRs, and on drafts that touch
  `packages/website/docs/guides/**` or `scripts/guides-typecheck/**`
  (its own inputs), otherwise deferred to `ready_for_review`.
- The `ci` aggregate's `guides-typecheck` skip allow-list recognises the new
  deferral condition, so a deferred draft does not fail on "Unexpectedly
  skipped job".
- `scripts/ci-suite-coverage.test.ts` gains coverage pinning the new gate and
  its aggregate counterpart in agreement, mirroring the existing
  "keeps the draft deferral, its two jobs and the ci aggregate in agreement"
  test.
- Findings report for the full job-by-job audit lands as the primary
  deliverable; NEEDS-DISCUSSION items (notably the `db_adapter_affected`
  draft opt-in, which pulled ~34 runner-minutes of PG+MariaDB into the draft
  phase on 5/30 recent merged PRs) are recorded there, not implemented.
