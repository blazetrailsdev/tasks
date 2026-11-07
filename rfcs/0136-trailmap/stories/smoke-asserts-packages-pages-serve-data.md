---
title: "smoke-prod tier 2 asserts /packages serves package data"
status: in-progress
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trailmap#126
claim: "2026-11-07T01:47:08Z"
assignee: "deviations-mark-null-matched-renders-null"
blocked-by: null
closed-reason: null
---

## Context

Production's `/packages` said "No package data" from #119 until trailmap#124,
and no check caught it. `STATS_DB` pointed at the crontab's `stats.db`, which has
no package tables. `scripts/smoke-prod.sh` tier 2 asserts
`tier2.graphs-parity-data` (at least one run and one package), but nothing on the
packages pages. `hasPackageData()` (#123) turns a missing table into the
"No package data" empty state, so the page answers 200 either way.

## Acceptance criteria

- smoke-prod tier 2 requests `/packages` over the loopback and fails by name when
  the body has "No package data" or links to no `/packages/<name>` page.
- It requests one `/packages/<name>` page and requires a 200.
- The failure text names `STATS_DB` and points at docs/deploy.md's stats section.
