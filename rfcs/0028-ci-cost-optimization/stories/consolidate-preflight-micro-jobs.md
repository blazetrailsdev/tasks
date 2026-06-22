---
title: "Consolidate the sub-minute preflight checks into one job to reclaim rounding"
status: claimed
updated: 2026-06-22
rfc: "0028-ci-cost-optimization"
cluster: parallelism-rounding
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: null
claim: "2026-06-22T17:39:59Z"
assignee: "consolidate-preflight-micro-jobs"
blocked-by: null
---

## Context

GitHub bills every job rounded **up** to the next whole minute. Three PR-only
checks each do a few seconds of work but bill a full minute apiece:

- `prettier` (avg 14 s) — `npx prettier --check` on changed files.
- `docs-activerecord-freeze` (avg 8 s) — a `git diff` grep for frozen-path edits.
- `pr-attribution` (avg 3 s) — a `gh api` fetch + grep of the PR body.

That's **3 billed minutes for ~25 seconds of compute** on every applicable PR.
All three are independent shell checks with no build/install dependency. Folding
them into a single `preflight` job (sequential steps) bills **1 minute** for the
same work — saving ~2 billed min/PR — while keeping each check's failure
independently legible in the step log.

## Acceptance criteria

- [ ] Create one `preflight` job containing the prettier, docs-AR-freeze, and
      pr-attribution checks as separate named steps. Preserve each step's
      current event/author semantics via per-step `if:` so a step no-ops when
      its condition isn't met (rather than skipping the whole job): prettier
      runs on push + PR (uses `changes.outputs.prettier_files`); docs-AR-freeze
      runs only on `pull_request`; pr-attribution runs only on
      deanmarano-authored PRs.
- [ ] The job needs `changes` (for `prettier_files`) and keeps
      `permissions: pull-requests: read` for the attribution step.
- [ ] Remove the three standalone jobs and update the aggregate `ci` job's
      `needs:` list and skip-allowlist accordingly (the three special-case
      branches collapse into one `preflight` case).
- [ ] CI green on: a deanmarano PR, a non-deanmarano PR (attribution step
      no-ops), a docs-only PR, and a push to `main`.

## Savings & risk

- **Expected wall-time impact: CONTENTION-ONLY (high close-risk).** These checks
  are sub-minute and run in parallel **off the critical path**, so on an
  uncontended run consolidating them changes end-to-end time-to-green by ~0. The
  only wall-time benefit is fewer concurrent jobs → less runner-pool queueing,
  which is invisible unless the pool is saturated. Under the wall-time bar this
  story **defaults to no-go** unless contention can be measured.
- **Est. savings:** ~2 billed job-min per PR (rounding) — a **cost** number, not
  a wall-time one. PRs are ~73% of runs.
- **Risk:** low. The checks are independent and fast; the only subtlety is
  faithfully reproducing each step's event/author guard as a step-level `if:`
  and updating the `ci` aggregate gate. No coverage change.

## Measurement & go/no-go

The win, if any, is queue-wait under contention — so it must be measured under
load, not on a quiet repo (see the RFC's "Measurement protocol").

- [ ] Baseline: median time-to-green over ≥5 PR runs **captured during a
      saturation window** (many concurrent runs queued), plus median runner
      queue-wait (run `created_at` → first job `started_at`).
- [ ] After consolidation, re-measure under comparable load.
- [ ] **Go:** median time-to-green or queue-wait drops by ≥10% or ≥15 s.
      **No-go (the default):** if contention can't be reproduced, or the metric
      is within noise, **close the PR** — do not merge on the rounding argument
      alone — and record the finding.
- [ ] PR description includes the under-load before/after table.

## Notes

Keep the checks as distinct steps (not one merged script) so a failure points at
the specific rule. Do **not** fold these into `changes` itself — `changes` is on
the critical path of every downstream gate, and a prettier/attribution failure
there would block gate computation; a separate `preflight` job keeps them off
that path.
