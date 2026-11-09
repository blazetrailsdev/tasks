---
title: "trailmap: rebuild the missing-compare-data fixture from a real stats snapshot"
status: claimed
updated: 2026-11-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-09T20:55:16Z"
assignee: "e2e-cover-the-pane-message-box"
blocked-by: null
closed-reason: null
---

## Context

trailmap#129 added `packagesMissingCompareData` (`lib/stats-sync/missing-compare-data.ts`)
and tests it against `test/fixtures/stats-sync/missing-compare-data-2026-11-07.json`.
No copy of the production stats DB was reachable, so that fixture was rebuilt
by hand from the story prose (packages-page-flags-missing-compare-data). It
proves the check matches the story, not production: real `description`
strings, real `compare_keys` (actionpack's NULL), and real api/test keys were
never read. The reason literal is written by trails
`scripts/parity/package-summary.ts:354` (`(Not in ${gate}: ${excluded})`).

## Acceptance criteria

- [ ] Regenerate the fixture from a real STATS_SYNC_DB snapshot (package_meta
      at one commit, plus distinct api_compare_stats / test_compare_stats
      packages), with the commit SHA recorded in the file.
- [ ] The fixture test's expected list is whatever the real snapshot yields;
      any difference from the 2026-11-07 list of 10 is explained in the PR.
