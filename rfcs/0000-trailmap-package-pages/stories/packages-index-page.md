---
title: "trailmap: /packages lists every package grouped by Rails counterpart and trails-only"
status: draft
updated: 2026-11-05
rfc: "0000-trailmap-package-pages"
cluster: package-pages
packages: [actionpack, actionview]
deps: [stats-sync-stores-package-summary-tables, story-touching-package-scope]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The RFC's "Pages" section. The group comes from `rails_counterpart` in `package_meta` (null = trails-only). Parity tiles read the latest
`api_compare_stats` / `test_compare_stats` row per package, as
`parity-graphs-controller.ts` already does; routes sit beside
`graphs/parity` in `trailmap/config/routes.ts:115-123`.

## Acceptance criteria

- [ ] `GET /packages` (`as: "packages"`) renders two groups, "Rails
      counterparts" and "trails-only"; every package in the latest
      `package_meta` commit is in exactly one, including the 13 with no
      compare rows, whose tiles say "no data".
- [ ] Each row: name, counterpart, api %, tests %, open-story count (by
      `Story.touchingPackage`), linking to `/packages/:name`.
- [ ] The page shows the `Story.unattributed()` open count.
- [ ] Controller test on a fixture stats database.
