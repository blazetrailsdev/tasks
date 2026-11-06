---
title: "trailmap: /packages/:name/files maps each Rails file to its TS port, method and test match, and open stories"
status: in-progress
updated: 2026-11-06
rfc: "0222-trailmap-package-pages"
cluster: package-pages
packages: [actionpack, actionview]
deps: [packages-index-page, stats-sync-stores-package-summary-tables]
deps-rfc: []
est-loc: 300
priority: null
pr: trailmap#121
claim: "2026-11-06T03:19:55Z"
assignee: "package-deviations-page"
blocked-by: null
---

## Context

The RFC's "Pages" section. Rows are `package_file_stats` for the latest synced
commit; open stories per file join `story_paths` on the TS path.

## Acceptance criteria

- [ ] `GET /packages/:name/files` lists every Rails `.rb` file grouped by
      directory: TS path or "unported", methods matched / missing, test match
      %, open-story count linking to those stories.
- [ ] Sortable by missing methods and by test match (query parameter, no JS
      required).
- [ ] Controller test on fixtures.
