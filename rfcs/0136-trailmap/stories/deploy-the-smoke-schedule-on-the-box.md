---
title: "Deploy the smoke schedule: ringo's cards, the crontab entries, the canary worktree"
status: claimed
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: ["harden-the-smoke-schedule-from-review"]
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-10-12T18:39:42Z"
assignee: "deploy-the-smoke-schedule-on-the-box"
blocked-by: null
closed-reason: null
---

## Context

trailmap#59 merged the schedule's code, and none of it is running. Three host
steps are left, and `run-the-smoke-suite-on-a-schedule` cannot be verified
until they are done: its Verification is "`/crons` shows the three entries
with recent successful runs; stopping the app turns tier 0 red within one
cadence."

- **Ringo's cards are not deployed.** Ringo has no GitHub remote and a push
  deploys it. The change is commit `31140dc` on branch `smoke-crons` in the
  btwhooks checkout (`~/github/deanmarano/btwebooks`, worktree
  `.claude/worktrees/smoke-crons`): `webhook/smokecron.go` and its test, a
  renderer in `webhook/crons.go`, a subnav entry in `webhook/nav.go`.
  `go test ./webhook/` passes there. Until it ships, a failing run is visible
  only in `~/github/blazetrailsdev/smoke-tier<N>.log`.
- **The crontab entries are not installed.** `scripts/smoke-cron.sh --crontab`
  prints them; they belong in the box user's crontab, run from the trailmap
  main checkout.
- **The canary worktree does not exist.** Tier 2 runs the CLI from
  `~/github/blazetrailsdev/worktrees/smoke-canary`, made by
  `scripts/start-worktree.sh smoke-canary`. Without it every `tier2.cli-*` row
  is red.

`docs/deploy.md` "Between deploys" describes all three as present fact.

Two things will be red once it runs, and neither is this story's to fix:
`tier2.graphs-parity-data` (story `mount-the-stats-database-on-the-deployed-app`),
and anything `harden-the-smoke-schedule-from-review` covers.

## Acceptance criteria

- [ ] btwhooks `smoke-crons` is merged and deployed, and `/crons` shows a card
      for each of tiers 0, 1 and 2
- [ ] The four crontab entries are installed from the main checkout
- [ ] The `smoke-canary` worktree exists and `tier2.cli-worktree` passes
- [ ] The PR body carries a screenshot of `/crons` with the three cards, which
      trailmap#59 did not have
- [ ] Stopping the app turns the tier 0 card red within 30 seconds, and the
      result is recorded on this story

## Verification

`crontab -l` names the four entries, and `/crons` shows tier 0 and tier 1 with
runs in the last minute.

## Result

Done on 2026-10-12, recorded with trailmap#69.

- btwhooks `smoke-crons` (`31140dc`) is on `main` and deployed; `/crons` shows a
  card for each of tiers 0, 1 and 2.
- The four crontab entries are installed from
  `~/github/blazetrailsdev/trailmap/scripts/smoke-cron.sh`.
- `smoke-canary` exists and tier 2 passes 24 of 24, `tier2.cli-worktree`
  included. `tier2.graphs-parity-data` passes too, though this story expected
  it red.
- **Stopping the app turned tier 0 red in 17 seconds.** `dokku ps:stop trailmap`
  returned at 14:56:50; the 14:57:01 run logged `FAIL tier0.up-loopback /up
answered 502, not 200`, written at 14:57:07. The app was started again at
  14:57:11 and tiers 0 and 1 were green on their next runs. The worst case is
  one 30-second cadence plus the run.
