---
title: "trailmap: /packages/:name/deviations shows receipts, marks, permanent skips and ratified rules"
status: in-progress
updated: 2026-11-06
rfc: "0222-trailmap-package-pages"
cluster: package-pages
packages: [actionpack, actionview]
deps: [packages-index-page, stats-sync-stores-package-summary-tables, story-touching-package-scope]
deps-rfc: []
est-loc: 350
priority: null
pr: trailmap#121
claim: "2026-11-06T03:19:55Z"
assignee: "package-deviations-page"
blocked-by: null
---

## Context

The RFC's "Pages" section. Counts come from `package_tag_stats` /
`package_mark_stats` (trended), sites from `package_tag_sites`, parked tests
from `package_skip_tests`. Surfaced deviations follow the RFC's rule: the
open stories of the package's `NNNN-<pkg>-surfaced-deviations` RFC where one
exists (0124, 0134, 0141, 0142, 0154, 0189, 0214), plus the open stories of
the retired `0023-surfaced-deviations` that `Story.touchingPackage`
attributes to the package. Ratified rules are the `claude_md_sections` rows
whose `anchor` a site or parked test of the package cites; trailmap reads no
trails checkout.

## Acceptance criteria

- [ ] Tag counts (`@noRailsEquivalent` PERMANENT / CONVERGEABLE,
      `@missingRailsCall`, `@missingRailsArgs`, `@missingRailsName`,
      `@inventedArm`, `@perf`, `@inlinedFrom`, `@internal`), each expanding to
      its `file:line` sites linked to GitHub at the synced commit.
- [ ] Mark and baseline counts with sparkline.
- [ ] `PERMANENT-SKIP` tests grouped by cited section; open surfaced-deviations
      stories; a "works differently than you'd expect" list of cited
      sections, each its heading, lede and GitHub link.
- [ ] Controller test on fixtures.
