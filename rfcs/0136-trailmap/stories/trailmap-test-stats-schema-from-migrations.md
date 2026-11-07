---
title: "Build trailmap test stats schema from the stats-sync migrations"
status: in-progress
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trailmap#126
claim: "2026-11-07T01:47:08Z"
assignee: "deviations-mark-null-matched-renders-null"
blocked-by: null
closed-reason: null
---

## Context

trailmap `test/models/stats-schema.ts` hand-declares scratch tables for the six package summary tables (package_meta, package_tag_stats, package_tag_sites, package_mark_stats, package_skip_tests, package_file_stats, claude_md_sections). Their columns duplicate `db/stats-sync-migrate/20261105000001_create_package_summary_tables.ts`, and the Rails twin carries a third copy at `rails/db/stats_migrate/20261105000002_create_package_summary_tables.rb` (added in trailmap#121). A column change in the stats-sync migration silently drifts the test schema.

## Acceptance criteria

- The test stats schema is built by running the stats-sync migrations (or a generated schema dump), not a hand-written table list.
- A column added to the stats-sync migration reaches both the TS and Rails test databases with no extra edit.
- package-pages tests in both apps still pass.
