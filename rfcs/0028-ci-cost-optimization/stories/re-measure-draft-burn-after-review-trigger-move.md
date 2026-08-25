---
title: "Re-measure the draft-deferral net saving once the review trigger moves pre-ready"
status: done
updated: 2026-08-08
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 6188
claim: "2026-08-07T17:21:52Z"
assignee: "abstract-adapter-pool-readers-soften-rails-behaviour"
blocked-by: null
closed-reason: null
---

## Context

PR #5749 defers `postgres-tests` / `maria-tests` on draft PRs. Its whole value
depends on how much iteration actually happens before the ready flip, and the
baseline was measured under the OLD regime, where the review fired on
draft -> ready.

Baseline (400 `pull_request` runs / 106 branches / 100 merged PRs, 29.5 h window
2026-07-30T14:22Z - 2026-07-31T19:54Z):

- Median PR open -> `ready_for_review`: **3.0 min**; pre-ready runs: **1.43/PR**.
- Saved per PR: 19.8 min (PG+MariaDB not run during the draft phase) x draft runs.
- Cost per PR: 17.6 min — the redundant non-PG/MariaDB half of the extra
  full-workflow run that `ready_for_review` now triggers.
- **Break-even: 0.89 draft runs/PR.** Observed 1.43, so net-positive but thin.
- Softening factor: a push followed the ready flip within a median 1.7 min in
  68 of 70 sampled PRs, cancelling most of that redundant run (modelled 4.2
  min/PR).

The review trigger is moving pre-ready, which should raise draft-phase runs and
widen the margin. That has to be confirmed, not assumed — if drafts still flip
ready in ~3 min, the deferral is close to break-even and should be reconsidered.

Method is reproducible from the merged analysis: `gh run list --workflow ci.yml
--event pull_request --limit 400`, per-job timing via
`gh api repos/blazetrailsdev/trails/actions/runs/$ID/jobs`, ready timestamps via
the issues timeline API, review timestamps from
`~/.btwhooks/data/github/blazetrailsdev/trails/$PR/*-review.md` mtimes.

## Acceptance criteria

- [ ] Draft-phase runs/PR and the PG+MariaDB share of burn re-measured over a
      comparable window after the review-trigger change is live.
- [ ] Net saving recomputed against the 0.89 break-even and written up.
- [ ] If the margin is below break-even, a recommendation to revert or re-scope
      the deferral (do not leave it shipped on a stale premise).
