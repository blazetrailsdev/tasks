---
title: "sync-stats: test_compare_stats feed stale since 2026-06-21 — summary-line regex broken by nested parens"
status: done
updated: 2026-07-31
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: 5721
claim: "2026-07-31T17:00:05Z"
assignee: "sync-stats-test-compare-regex-stale"
blocked-by: null
closed-reason: null
---

## Context

The stats DB (`~/github/blazetrailsdev/stats.db`) has no `test_compare_stats`
rows for merge commits after 2026-06-21, while `api_compare_stats` kept syncing
normally (verified 2026-07-31: `MAX(merged_at)` over joined
`test_compare_stats` rows is `2026-06-21T19:34:07Z`; api rows continue through
W31). The historical AR test-parity time series is blind for the last six
weeks.

Root cause: `parseTestCompareFromLogs`
(`scripts/sync-stats/sync.ts:1741-1773`) parses the per-package summary line
out of CI logs with

```text
/\s{2}(\w+)\s+—\s+(\d+)\/(\d+) tests \(([\d.]+)%\)(?:\s+\(([^)]*)\))?\s+\|\s+.../
```

The optional details group `\(([^)]*)\)` cannot span nested parentheses. Trails PR 3825 (merged 2026-06-21, `084167315`,
"feat(test-compare): add per-file
extra-tests column to surface bloated files") added the `N extra (TS only)`
annotation to the summary parenthetical, e.g.:

```text
  globalid  —  131/131 tests (100%) (48 extra (TS only))  |  6/6 files  |  0 misplaced
```

`[^)]*` stops at the first `)` (after `TS only`), the regex then requires
`\s+\|` but sees the second `)`, and the whole line fails to match — so every
package with extra tests (all of them, in practice) silently drops out and
zero rows are upserted. No error is raised; the sync logs simply record
nothing (`logs_parsed` still increments via other steps).

Two additional latent issues in the same function worth fixing while here:

- `(\w+)` does not match hyphenated package names (`did-you-mean`), which have
  therefore never synced.
- There is no "parsed 0 packages from a test_compare step" warning, which is
  why this went unnoticed for six weeks.

## Acceptance criteria

- `parseTestCompareFromLogs` matches the current `parity:test` summary
  format, including nested parens in the details group (e.g. balance-aware
  parsing or anchoring on the pipe-separated column layout instead of the
  parenthetical) and
  hyphenated package names.
- A unit test covers a current-format log fixture (with `extra (TS only)` and
  a hyphenated package) and the pre-#3825 format.
- The sync warns loudly when a `test_compare` step log is present but zero
  package rows parse, so a future format drift is caught within a sync cycle.
- Backfill: re-parse the already-stored `compare_logs` / `raw_job_logs` rows
  for the 2026-06-21 → present window so the `test_compare_stats` series has
  no gap (the logs are already in the DB; no GitHub API calls needed).
