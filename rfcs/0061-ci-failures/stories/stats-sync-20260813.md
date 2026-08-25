---
title: "trails stats sync cron failing: Error: Command failed: gh pr list --repo blazetrailsdev/trails --state all --limit 1000…"
status: done
updated: 2026-08-13
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: 6465
claim: "2026-08-13T14:16:33Z"
assignee: "stats-sync-20260813"
blocked-by: null
closed-reason: null
---

## Context

The nightly trails stats sync (host crontab → `scripts/sync-stats/cron-wrapper.sh`, daily at 06:00 America/New_York) failed on its 2026-08-13 run. Until it is fixed, `stats.db` stops receiving new PRs, workflow runs, job logs, and api/test:compare rows, so every dashboard and query built on it silently goes stale.

The wrapper appends each run to `/home/dean/github/blazetrailsdev/stats-sync.log`; this is the failing output:

```text
Error: Command failed: gh pr list --repo blazetrailsdev/trails --state all --limit 1000 --json number,title,author,createdAt,mergedAt,closedAt,mergeCommit,additions,deletions,changedFiles,labels,headRefName,baseRefName,body,reviewDecision,isDraft --jq '[.[] | select(.number > 6403)]'
stream error: stream ID 1; CANCEL; received from peer
    at genericNodeError (node:internal/errors:985:15)
    at wrappedFn (node:internal/errors:539:14)
    at checkExecSyncError (node:child_process:925:11)
    at execSync (node:child_process:997:15)
    at gh (/home/dean/github/blazetrailsdev/trails/scripts/sync-stats/sync.ts:107:22)
    at ghJson (/home/dean/github/blazetrailsdev/trails/scripts/sync-stats/sync.ts:128:21)
    at syncPullRequests (/home/dean/github/blazetrailsdev/trails/scripts/sync-stats/sync.ts:1200:18)
    at async main (/home/dean/github/blazetrailsdev/trails/scripts/sync-stats/sync.ts:2544:23) {
  status: 1,
  signal: null,
```

Reproduce with `pnpm stats:sync --latest` from the trails checkout (the `prestats:sync` hook builds `@blazetrails/activerecord`'s `dist/` first — failures often come from that build, not the sync itself).

## Acceptance criteria

- `pnpm stats:sync --latest` completes successfully from a clean checkout.
- The failure mode above cannot silently recur — if it was a build/config drift, the fix pins or guards it rather than being a one-off rebuild.
- No change to the cron schedule or the wrapper's alerting behaviour unless that IS the bug.
