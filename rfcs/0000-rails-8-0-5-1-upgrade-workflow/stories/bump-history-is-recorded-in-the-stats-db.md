---
title: "Bump history is recorded in the stats DB: dry-run reports, flip events and the ledger's burn-down curve"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-0-5-1-upgrade-workflow"
cluster: tooling
packages: [scripts]
deps:
  [
    bump-dry-run-runs-the-gates-against-a-candidate-ref,
    bump-ledger-tracks-drifted-pairs-and-the-body-pins-gate-reads-it,
  ]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 7 "History in the stats DB" (owner request, 2026-10-13). The stats DB
(`~/github/blazetrailsdev/stats.db`, written by `scripts/sync-stats/sync.ts`)
already holds per-merge-commit compare figures, for example
`api_compare_stats` and `test_compare_stats` keyed on
(`merge_commit_sha`, `package`) (`sync.ts:885-911`). It has nothing about a
`ref` bump: what was predicted, when the flip landed, or how fast the ledger
emptied. The first measurements of the 8.0.5.1 and 8.1.4 bumps exist only as tables in the
RFC and in gitignored output files.

The DB is the owner's and lives on one machine, so nothing writes to it but
the sync. Everything recorded has to be derivable from the repo and from CI
logs, so a rebuilt DB has the same history.

## Acceptance criteria

- [ ] The dry run writes a versioned JSON report, committed by each flip PR at
      `scripts/parity/bump-ledger/reports/<source>-<from>-<to>.<date>.json`:
      source, both refs and SHAs, the trails commit, the per-package size
      figures of RFC § 2, the per-gate result and counts, and the seed's row
      counts by package and kind. More than one report per bump is allowed.
- [ ] The ledger gate prints one parseable summary line per source on every
      `rails-comparison` run: rows remaining by package and kind, or that no
      ledger exists.
- [ ] `sync.ts` creates and fills, with the same idempotent upsert style as
      the existing compare tables:
      `vendor_bumps` (source, from/to ref and SHA, flip PR and merge commit,
      merged-at, tag, closed-at, burn-down RFC);
      `vendor_bump_reports` and `vendor_bump_report_packages` (one row per
      committed report, and per package within it);
      `vendor_bump_gate_results` (report, gate, status, counts);
      `bump_ledger_stats` (`merge_commit_sha`, `pr_number`, source, package,
      kind, rows), parsed from the summary line.
- [ ] Existing DBs gain the tables through the same add-if-missing path
      `sync.ts` uses for its other late tables.
- [ ] The two 2026-10-13 measurements, `v8.0.5.1` in RFC § 2 and `v8.1.4`
      in § 8, are backfilled as report files with `"method": "manual"`,
      transcribed from the RFC's tables, so the first predictions are in the
      history.
- [ ] A query in the PR body returns, for one bump, predicted rows against
      rows at the flip and the days from flip to empty ledger.
- [ ] Parser tests sit beside `parse-call-summaries.test.ts`.
- [ ] The `rails-comparison` job's existing compare output is unchanged.

## Definition of done

Writing to `stats.db` from an agent session or from CI does not close this
story; the sync is the only writer.
