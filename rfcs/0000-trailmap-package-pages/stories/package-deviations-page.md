---
title: "trailmap: /packages/:name/deviations shows receipts, marks, permanent skips and ratified rules"
status: draft
updated: 2026-11-05
rfc: "0000-trailmap-package-pages"
cluster: package-pages
packages: [actionpack, actionview]
deps: [package-overview-page]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The RFC's "Pages" section. Counts come from `package_tag_stats` /
`package_mark_stats` (trended), sites from `package_tag_sites`. Open
`<pkg>-surfaced-deviations` stories are the RFC named that way
(`pnpm tasks list | grep surfaced-deviations`). Ratified rules are the
`CLAUDE.md` sections cited by the package's `PERMANENT-SKIP` lines and
`PERMANENT` receipts, linked to the section heading on GitHub.

## Acceptance criteria

- [ ] Tag counts (`@noRailsEquivalent` PERMANENT / CONVERGEABLE,
      `@missingRailsCall`, `@missingRailsArgs`, `@missingRailsName`,
      `@inventedArm`, `@perf`, `@inlinedFrom`, `@internal`), each expanding to
      its `file:line` sites linked to GitHub at the synced commit.
- [ ] Mark and baseline counts with sparkline.
- [ ] `PERMANENT-SKIP` tests grouped by cited section; open surfaced-deviations
      stories; a "works differently than you'd expect" list of cited sections.
- [ ] Controller test on fixtures.
