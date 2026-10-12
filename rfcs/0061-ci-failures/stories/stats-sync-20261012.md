---
title: "trails stats sync cron failing: [ELIFECYCLE] Command failed with exit code 2."
status: closed
updated: 2026-10-12
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: null
claim: "2026-10-12T10:30:37Z"
assignee: "stats-sync-20261012"
blocked-by: null
closed-reason: "Not a main failure: origin/main (7b390241a2) builds clean and pnpm stats:sync --latest exits 0. The cron runs in the default checkout, which was on local branch examples/perry-native; its example workspace pins @types/node ^22, installing a second @types/node (22.20.5, hoisted Oct 11 20:05) beside 25.3.5 and breaking the prestats tsc build. Backfilled from an origin/main worktree: stats.db reaches PR 8809, workflow run 38195075649, api/test compare rows for 7b390241a2."
---

## Context

The nightly trails stats sync (host crontab → `scripts/sync-stats/cron-wrapper.sh`, daily at 06:00 America/New_York) failed on its 2026-10-12 run. Until it is fixed, `stats.db` stops receiving new PRs, workflow runs, job logs, and api/test:compare rows, so every dashboard and query built on it silently goes stale.

The wrapper appends each run to `/home/dean/github/blazetrailsdev/stats-sync.log`; this is the failing output:

```text
[ELIFECYCLE] Command failed with exit code 2.
[cron-wrapper] stats sync failed at stage "startup" (exit 2): packages/activesupport/src/cache/file-store-atomic-write.trails.test.ts(65,16): error TS2339: Property 'on' does not exist on type 'Worker'.
```

Reproduce with `pnpm stats:sync --latest` from the trails checkout (the `prestats:sync` hook builds `@blazetrails/activerecord`'s `dist/` first — failures often come from that build, not the sync itself).

## Acceptance criteria

- `pnpm stats:sync --latest` completes successfully from a clean checkout.
- **The gap this outage left is backfilled before you finish.** Run the sync until `stats.db` has caught up with the repo, and say in the PR description which PR number, workflow run, and compare row it now reaches. Do not leave the catch-up to the next scheduled run.
- The failure mode above cannot silently recur — if it was a build/config drift, the fix pins or guards it rather than being a one-off rebuild.
- No change to the cron schedule or the wrapper's alerting behaviour unless that IS the bug.
