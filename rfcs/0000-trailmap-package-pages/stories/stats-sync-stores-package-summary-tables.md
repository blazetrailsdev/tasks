---
title: "trailmap: stats-sync downloads parity-outputs and stores package summary tables"
status: draft
updated: 2026-11-05
rfc: "0000-trailmap-package-pages"
cluster: package-summary-data
packages: [activerecord]
deps: [emit-package-summary-json]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

stats-sync today parses compare tables out of CI job logs
(`trailmap/lib/stats-sync/sync.ts:865-911`, `classify-compare-step.ts:14-34`)
into per-package tables (`db/statsSync_schema.ts:17-60,212-224`); it stores no
per-file rows, no params / predicates totals, and no tag or mark counts.
`emit-package-summary-json` puts all of these in the `parity-outputs-<sha>`
artifact (90-day retention). trailmap reads stats.db read-only through
`Stats` (`app/models/stats.ts:1-33`); only the sync writes.

## Acceptance criteria

- [ ] A migration under `db/stats-sync-migrate/` adds `package_tag_stats`,
      `package_mark_stats`, `package_file_stats` (keyed by
      `merge_commit_sha`, `pr_number`, `package`, plus `ruby_file` for files)
      and `package_tag_sites` (latest commit only).
- [ ] The sync downloads `parity-outputs-<sha>` for each merged commit it
      syncs (`gh run download`, through the existing `gh` helper and its
      rate-limit budget) and upserts the rows.
- [ ] A missing or expired artifact is recorded in `sync_log` and skipped,
      not recomputed.
- [ ] Read-side `Stats` models for each table, and a test that a fixture
      artifact lands the expected rows.
