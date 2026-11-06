---
title: "trailmap: stats-sync downloads parity-outputs and stores package summary tables"
status: done
updated: 2026-11-06
rfc: "0222-trailmap-package-pages"
cluster: package-summary-data
packages: [activerecord]
deps: [emit-package-summary-json, emit-package-file-rows]
deps-rfc: []
est-loc: 350
priority: null
pr: trailmap#119
claim: "2026-11-05T22:19:15Z"
assignee: "stats-sync-stores-package-summary-tables"
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

- [ ] A migration under `db/stats-sync-migrate/` adds the seven tables of
      the RFC's "Data" table — `package_meta`, `package_tag_stats`,
      `package_mark_stats`, `package_file_stats`, `package_tag_sites`,
      `package_skip_tests`, `claude_md_sections` — with exactly those columns;
      the per-commit ones keyed by `merge_commit_sha`, `pr_number`, the three
      latest-only ones replaced on each sync.
- [ ] The sync downloads `parity-outputs-<sha>` for each merged commit it
      syncs (`gh run download`, through the existing `gh` helper and its
      rate-limit budget) and upserts the rows.
- [ ] A missing or expired artifact is recorded in `sync_log` and skipped,
      not recomputed.
- [ ] Read-side `Stats` models for each table, and a test that a fixture
      artifact lands the expected rows.
