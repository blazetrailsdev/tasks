---
title: "defer-more-jobs-out-of-pre-ready"
status: done
updated: 2026-08-03
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5931
claim: "2026-08-02T23:11:05Z"
assignee: "defer-more-jobs-out-of-pre-ready"
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

## Scope change (2026-08-02)

The criteria below originally specified a `ready_for_review` **deferral** of
`guides-typecheck`, mirroring the PG/MariaDB suites. That shipped first
(`bf90da94b`), and the owner then redirected: draft-gating still ran the job on
every PR that reaches merge, so it kept costing 40-83s a push to report drift
nobody acts on during review. The mechanism was changed to a **label opt-in**
(`b15727b59`) — off on PRs entirely unless labelled — with `main` / the Monday
sweep / `workflow_dispatch` as the standing coverage. The criteria are rewritten
to the shipped mechanism rather than left contradicting it.

Consequence, accepted deliberately: a guide snippet that stops compiling is
caught by the push-to-main run or the weekly sweep, not by the PR that broke it,
so the fix lands as a follow-up commit on `main`.

## Acceptance criteria

- `guides-typecheck` takes the same shape as `sqlite-mem-tests`
  (`ci.yml:888-896`): it runs on non-PR events (push to `main`, the Monday
  `schedule` sweep, `workflow_dispatch`) and on a PR carrying a `run-guides`
  label — never on an unlabelled PR, draft or ready. It stays in the `ci`
  aggregator's `needs:`, so a labelled run still gates the merge.
- The `run-guides` label exists on the repo and is documented in the
  `on.pull_request` label block; `labeled` is in `on.pull_request.types`, so
  applying it starts a run without a fresh push.
- The `ci` aggregate's `guides-typecheck` skip allow-list recognises the
  unlabelled-PR condition (`GUIDES_UNLABELLED`), so an unlabelled PR does not
  fail on "Unexpectedly skipped job".
- `scripts/ci-suite-coverage.test.ts` gains coverage pinning the job gate and
  its aggregate counterpart at opposite polarity, plus the `labeled` trigger and
  the `schedule` / push-to-`main` triggers that are now the standing coverage.
  It must fail on baseline.
- Findings report for the full job-by-job audit lands as the primary
  deliverable; NEEDS-DISCUSSION items (notably the `db_adapter_affected`
  draft opt-in, which pulled ~34 runner-minutes of PG+MariaDB into the draft
  phase on 5/30 recent merged PRs) are recorded there, not implemented.
  Delivered via the `audit-report` skill (audits live outside the repo, so it
  is not part of this PR's diff):
  `~/.btwhooks/data/github/blazetrailsdev/trails/audits/pre-ready-ci-deferral-20260802T231228Z.md`.
