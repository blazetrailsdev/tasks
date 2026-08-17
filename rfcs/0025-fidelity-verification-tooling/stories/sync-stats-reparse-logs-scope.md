---
title: "sync-stats: let --reparse-logs be scoped to a PR/date range"
status: draft
updated: 2026-07-31
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5721 added `--reparse-logs` to `scripts/sync-stats/sync.ts`: a no-network
mode that re-parses already-stored `raw_job_logs` rows. To make partial
per-package gaps recoverable it drops `MISSING_STATS_PREDICATE` entirely, so
every stored log is revisited on every invocation — currently 3,289 job logs,
growing with history.

That is the right default for a recovery mode (it is what recovered 800 rows
the per-commit gate had permanently hidden), but there is no way to scope the
pass. Re-running it to repair a known-bad window costs a full-history walk.

## Acceptance criteria

- `--reparse-logs` accepts an optional scope, reusing the existing `--prs`
  spec parser (`parsePrSpec`) and/or a merged-at date range, so a targeted
  repair does not walk all history.
- Unscoped `--reparse-logs` keeps today's behaviour (full unconditional
  re-parse) so the recovery guarantee is unchanged.
- The chosen scope is echoed in the mode banner and the row count is reported.

## Re-verified 2026-08-17 (draft sweep)

Still valid. Kept separate from `sync-stats-compare-parse-hygiene` (the merged
parsing-hygiene story): this is a CLI ergonomics change to `--reparse-logs`, not a
parser correctness fix.
