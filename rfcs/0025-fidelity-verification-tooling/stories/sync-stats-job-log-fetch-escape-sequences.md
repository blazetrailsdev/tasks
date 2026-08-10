---
title: "sync-stats: job-log fetch broken by gh 2.97's escape-sequence guard — compare feed stale since 2026-08-03"
status: done
updated: 2026-08-07
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 0
pr: 6183
claim: "2026-08-07T17:38:08Z"
assignee: "sync-stats-job-log-fetch-escape-sequences"
blocked-by: null
closed-reason: null
---

## Context

**The stats DB has ingested no CI comparison logs since 2026-08-03.** `gh`
2.97.0 (released 2026-07-31) started refusing to print responses containing
terminal escape sequences unless `--allow-escape-sequences` is passed. Job logs
are full of them, so every fetch in `syncJobLogs` now fails:

```text
Fetching logs for 50 jobs...
  Failed to fetch logs for job 92743856718 "Rails API/Test Comparison" (PR #6161):
  Command failed: gh api repos/blazetrailsdev/trails/actions/jobs/92743856718/logs
  the response contains terminal escape sequences; pass --allow-escape-sequences to output it anyway
  ...
  Fetched 0 job logs
```

The call is `scripts/sync-stats/sync.ts:1889`:

```ts
const logs = gh(`api repos/${REPO}/actions/jobs/${jobId}/logs`);
```

Adding the flag fixes it — verified by hand against the same job that fails in
the log above:

```sh
gh api --allow-escape-sequences repos/blazetrailsdev/trails/actions/jobs/92743856718/logs
# -> 8,742 lines, exit 0
```

### What it has cost

The rest of the sync is healthy — PRs and workflow runs are current to #6167 —
so the breakage is silent. Only the log fetch, and everything downstream of it,
is dead:

- `raw_job_logs` stops at PR **#5945**; **210 merged PRs** and **75 successful
  "Rails API/Test Comparison" jobs** are unparsed.
- `api_compare_stats`, `api_compare_privates_stats` and `test_compare_stats`
  therefore all stop at #5945, and the cron still reports `ok` every night.
- Every parity number anyone reads is frozen at 2026-08-03. Concretely, from
  PR #6161's CI log versus what the DB still serves:

  | package          | DB (Aug 3) | CI (Aug 7)                |
  | ---------------- | ---------- | ------------------------- |
  | activerecord     | 99.0%      | **100%** (6148/6148)      |
  | activemodel      | 96.2%      | **100%** (716/716)        |
  | actionview       | 9.8%       | 33.9%                     |
  | actioncontroller | 78.5%      | 87.9%                     |
  | i18n             | _absent_   | **100%** (239/239)        |
  | date             | _absent_   | 0/138 tests (parity:test) |

- `i18n` (enrolled by #5978 / #6002) and `date` (enrolled by #6148) have never
  appeared in the DB at all, because both landed after the cutoff. This story is
  what makes them show up; their enrollment is already correct and needs no
  change.

This is the second silent stall of this feed — see
`sync-stats-test-compare-regex-stale` in this RFC, where `test_compare_stats`
went stale for weeks before anyone noticed. The recurring defect is that a run
which parses nothing still exits `0`.

## Acceptance criteria

- `syncJobLogs`'s `gh api .../logs` call passes `--allow-escape-sequences` (or
  otherwise tolerates escape sequences), and a normal `latest` sync fetches logs
  again.
- **A run that fetches nothing fails loudly.** If `syncJobLogs` selects N > 0
  jobs and fetches 0, the sync exits non-zero with a clear message, so the cron
  wrapper's log records a failure and ringo's `/crons` page flags it instead of
  showing a green run. This is the guard that would have caught both stalls.
- The backlog is backfilled: job logs are fetched and parsed for the merged PRs
  between #5945 and HEAD, so `api_compare_stats`,
  `api_compare_privates_stats` and `test_compare_stats` have rows for them, and
  `i18n` and `date` are present. Mind `RATE_LIMIT_RESERVE` — this is ~210 PRs of
  log fetches and the existing throttle should carry it, possibly across more
  than one pass.
- Test coverage in `scripts/sync-stats` in keeping with the existing suite
  (`parse-test-compare.test.ts`, `module-format.test.ts`).
- **Do not touch `vendor/sources.ts`.** `i18n` is correctly enrolled, and
  `date`'s `compareApi: false` is RFC 0088's measured decision (the gem's
  surface is C; the Ruby extractor sees 12 methods against 2,805 lines of port).
  `date` is measured by `parity:test` only, and 0/138 is its true standing.

## Notes

- The DB is ~3.5 GB and in WAL mode; the backfill is long-running. Check whether
  `--reparse-logs` or a scoped backfill flag is the right entry point — see the
  sibling story `sync-stats-reparse-logs-scope`, which wants exactly that
  scoping and may be worth doing first or folding in.
- ringo's `/graphs/parity` page reads this DB directly, so the fix is visible
  there as soon as a sync lands.
