---
title: "CI jobs set timeout-minutes, and dashboard-e2e cleans up what it starts"
status: draft
updated: 2026-10-21
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On trailmap#72's last run (actions run 39622187282) every step of the
`dashboard-e2e` job, including `./scripts/dashboard-e2e.sh`, finished
successfully. The job itself still reported `in_progress` after 25 minutes,
while the run was `completed / success`, so the PR showed a pending check and
merge state `UNSTABLE`. The job normally takes about 1½ minutes (main runs on
10-12, 10-15 and 10-20). `.github/workflows/ci.yml`'s `dashboard-e2e` job has
no `timeout-minutes`, so if the script itself ever really hangs, it holds a
runner and the check for GitHub's 6-hour default.

## Acceptance criteria

- `dashboard-e2e` (and any other job without one) sets `timeout-minutes` at a
  few times its normal duration, e.g. 10.
- `scripts/dashboard-e2e.sh` stops the processes it starts (server, browser) on
  exit, including on failure, so nothing it spawns outlives the step.
