---
title: "sync-stats: verify and finish the #5945→HEAD job-log backfill"
status: draft
updated: 2026-08-07
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6183 fixed the `gh` 2.97 escape-sequence breakage in `syncJobLogs`
(`scripts/sync-stats/sync.ts`) and added the zero-fetch guard, so new syncs
ingest job logs again. The **backlog** half of
`sync-stats-job-log-fetch-escape-sequences` is not verified done: a
`pnpm stats:sync --missing` pass was started against the live DB
(`~/github/blazetrailsdev/stats.db`, ~3.5 GB, WAL) but was still in the
uncapped workflow-run phase ("Fetching workflow runs for 2419 merge commits")
when the PR merged and the pane was reaped. It may have completed, been
killed with the pane, or stopped on `RATE_LIMIT_RESERVE`.

Trails-internal tooling — no Rails counterpart, so this is not a convergence
story.

## Acceptance criteria

- Confirm `raw_job_logs` covers merged PRs from #5945 through HEAD (the story's
  original gap was 210 merged PRs / 75 "Rails API/Test Comparison" jobs); run
  further `pnpm stats:sync --missing` passes until it stops advancing.
- `api_compare_stats`, `api_compare_privates_stats` and `test_compare_stats`
  have rows for those merge commits.
- `i18n` and `date` appear in the stats tables (both enrolled after the
  2026-08-03 cutoff and never ingested). Do NOT touch `vendor/sources.ts`;
  `date`'s `compareApi: false` is RFC 0088's measured decision.
- Note the observed transient `dial tcp ... i/o timeout` failures from
  `gh api .../jobs` during the run — they are absorbed per-PR, but a long
  backfill should be re-run until the counts stop moving.

## Re-verified 2026-08-17 (draft sweep)

Still valid, and still a **verification chore rather than a code change**: the
first task is to query `~/github/blazetrailsdev/stats.db` and establish whether
`raw_job_logs` covers #5945→HEAD. If coverage is complete the story closes with
that evidence and no diff. Kept separate from `sync-stats-compare-parse-hygiene`
for that reason.
