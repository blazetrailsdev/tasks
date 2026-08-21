---
title: "trails stats sync cron failing: [ELIFECYCLE] Command failed with exit code 1."
status: ready
updated: 2026-08-21
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The nightly trails stats sync (host crontab → `scripts/sync-stats/cron-wrapper.sh`, daily at 06:00 America/New_York) failed on its 2026-08-21 run. Until it is fixed, `stats.db` stops receiving new PRs, workflow runs, job logs, and api/test:compare rows, so every dashboard and query built on it silently goes stale.

The wrapper appends each run to `/home/dean/github/blazetrailsdev/stats-sync.log`; this is the failing output:

```text
[ELIFECYCLE] Command failed with exit code 1.
```

Reproduce with `pnpm stats:sync --latest` from the trails checkout (the `prestats:sync` hook builds `@blazetrails/activerecord`'s `dist/` first — failures often come from that build, not the sync itself).

## Acceptance criteria

- `pnpm stats:sync --latest` completes successfully from a clean checkout.
- **The gap this outage left is backfilled before you finish.** Run the sync until `stats.db` has caught up with the repo, and say in the PR description which PR number, workflow run, and compare row it now reaches. Do not leave the catch-up to the next scheduled run.
- The failure mode above cannot silently recur — if it was a build/config drift, the fix pins or guards it rather than being a one-off rebuild.
- No change to the cron schedule or the wrapper's alerting behaviour unless that IS the bug.
