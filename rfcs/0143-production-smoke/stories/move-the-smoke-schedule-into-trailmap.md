---
title: "Move the smoke schedule into trailmap's own scheduler"
status: draft
updated: 2026-10-12
rfc: "0143-production-smoke"
cluster: null
packages: []
deps: ["run-the-smoke-suite-on-a-schedule", "record-smoke-runs-in-a-table"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`run-the-smoke-suite-on-a-schedule` took the cheap home: the host crontab runs
trailmap's `scripts/smoke-cron.sh <tier>`, which takes a per-tier `flock`,
kills the tier ten seconds short of its cadence with `timeout`, and appends
each run to `~/github/blazetrailsdev/smoke-tier<N>.log`. Ringo parses those
logs into three cards on `/crons` (`webhook/smokecron.go` in btwhooks).

Three parts of that are borrowed and move here:

- **The clock.** Cron counts in minutes, so tier 0's 30s cadence is two crontab
  entries with a `sleep 30`. The entries live in one user's crontab, outside
  the repo, installed by hand from `scripts/smoke-cron.sh --crontab`.
- **The overlap and budget rules.** `cadence`, the lock and the kill are bash
  in `scripts/smoke-cron.sh`. A scheduler owns them as job configuration.
- **The report.** The log is the only record and ringo is the only reader.
  `record-smoke-runs-in-a-table` makes a run a row; once it has, the log and
  ringo's parser are a second read model of the same runs.

RFC 0143 calls building the scheduler proving-ground work: background jobs are
framework surface nothing has made trails exercise (Rails'
`activejob/lib/active_job` and a recurring-task runner). Expect trails stories
to fall out of this one; file them against trails rather than working around
them in trailmap.

Tier 2 has one constraint a scheduler inside the container cannot meet as it
stands: it runs the installed `tasks` binary from a host worktree, in an
agent's login-shell environment. Decide whether the scheduler runs on the host
or tier 2 keeps a host-side runner, and say which in the PR.

## Acceptance criteria

- [ ] Tiers 0 to 2 are scheduled by trailmap at 30s, 1m and 5m, with no
      crontab entry
- [ ] A tier still cannot overlap itself, and a hung tier is still killed
      inside its cadence
- [ ] Tier 2 still runs the `tasks` binary where an agent stands, or the story
      that restores that is filed and linked
- [ ] `scripts/smoke-cron.sh`, its CI self-test, the crontab entries and the
      "Between deploys" section of `docs/deploy.md` are removed or rewritten
- [ ] Ringo's `webhook/smokecron.go` cards are removed once trailmap renders
      the runs itself
- [ ] Every trails defect the scheduler surfaced is filed in trails

## Verification

`crontab -l` on the box names no smoke entry, and the smoke history shows
tier 0 runs 30 seconds apart across a redeploy.
