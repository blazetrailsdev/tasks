---
title: "Consolidate the sub-second preflight checks into one job to reclaim rounding"
status: draft
updated: 2026-06-15
rfc: "0000-ci-cost-optimization"
cluster: parallelism-rounding
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
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

- **Est. savings:** ~2 billed job-min per PR. PRs are ~73% of runs, so this is
  high-frequency, low-risk recurring savings.
- **Risk:** low. The checks are independent and fast; the only subtlety is
  faithfully reproducing each step's event/author guard as a step-level `if:`
  and updating the `ci` aggregate gate. No coverage change.

## Notes

Keep the checks as distinct steps (not one merged script) so a failure points at
the specific rule. Do **not** fold these into `changes` itself — `changes` is on
the critical path of every downstream gate, and a prettier/attribution failure
there would block gate computation; a separate `preflight` job keeps them off
that path.
