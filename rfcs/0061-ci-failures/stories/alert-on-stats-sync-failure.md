---
title: "Alert when the nightly stats sync fails instead of only logging it"
status: in-progress
updated: 2026-08-21
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6816
claim: "2026-08-21T12:50:30Z"
assignee: "alert-on-stats-sync-failure"
blocked-by: null
closed-reason: null
---

## Context

This is the second stats-sync outage filed in two weeks (`stats-sync-20260813`,
`stats-sync-20260821`), and both were noticed only because a human read
`/home/dean/github/blazetrailsdev/stats-sync.log` after the fact. The wrapper —
`scripts/sync-stats/cron-wrapper.sh`, host crontab, 06:00 America/New_York —
appends each run's output to that log and exits. Nothing watches the exit code,
so a failed run is indistinguishable from a successful one until someone looks,
and `stats.db` silently stops receiving PRs, workflow runs, job logs and
api/test:compare rows in the meantime. Every dashboard built on it goes stale
without a signal.

Both outages also demonstrate that the failure is _not_ self-clearing: the
2026-08-21 run failed identically every night it ran (a `RangeError` on one, a
permanently-404ing job-log batch on the other, PR #6808), so the gap grows a day
per day until a human intervenes.

Scope is the wrapper only. PR #6808 deliberately did not touch it — the story
that fixed the crash was explicitly scoped "no change to the cron schedule or
the wrapper's alerting behaviour unless that IS the bug", and it was not the
bug. This story is that carve-out.

## Acceptance criteria

- A non-zero exit from `pnpm stats:sync` produces a signal that reaches someone
  without them opening the log — the existing btwhooks pane-notification path
  (`~/.btwhooks/`) is the obvious carrier, since it already delivers CI failures
  to a tmux pane.
- The signal names the failing stage and carries enough of the error to triage
  (the ELIFECYCLE line alone is useless — in both outages the real error was
  several lines above it).
- A successful run stays silent; this must not become a nightly notification
  that gets tuned out.
- Optionally: report staleness as well as failure, so a wrapper that stops being
  invoked at all (crontab edited, host rebooted, pnpm missing) is also visible.
  A run that never happens produces no failing exit code to alert on.
- No change to the sync's own behaviour or to the cron schedule.
