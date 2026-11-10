---
title: "trailmap: Fleet header row, search field and two-column panel grid"
status: draft
updated: 2026-11-10
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-shell
packages: [actionview]
deps: [fleet-palette-tokens]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`app/views/dashboard/index.html.tse` stacks the Fleet cards in one column:
status pills (`#eventsPill`, `#tmuxPill`, `#mainCIPills`, `#watchPill`,
`#agentPills`, `#pauseBtn`), `#askPanel`, `#ciFixerPanel`, `#usageGroup`,
`#spawnLoopPanel`, the broadcast card and `#spawnPanel`, and `dashboard.js`
fills them by id. The RFC's "The top section" gives the target: a header row
with pills, a search field and Broadcast and Spawn buttons, and a two-column
grid pairing Waiting on you with Usage, and CI fixer with Loop.

## Acceptance criteria

- [ ] The header row and the two-column grid replace the stacked cards, and
      grid rows share a height.
- [ ] The header has a search field (inert until `fleet-palette-search`) and
      a search button shown below 700px.
- [ ] Every element id `dashboard.js` writes to survives, so no rendering
      code changes beyond selectors.
- [ ] Main CI's state is shown once, in the CI fixer panel, and the pill
      links to it.
- [ ] The broadcast and spawn forms stay in place, reachable from the header
      buttons, until `fleet-palette-actions` moves them.

## Verification

- `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job) passes with selector updates only.
- `git diff --stat` shows no change under `app/controllers/` or to a control
  request in `fleet-format.js`.
