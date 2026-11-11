---
title: "trailmap: dashboard header row, search field and Usage and Loop panels"
status: draft
updated: 2026-11-11
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
fills them by id. The RFC's "The top section" gives the target: no visible title, a header
row with the connection dots and Broadcast and Spawn buttons, and Usage and
Loop side by side. Waiting on you and CI fixer leave the top for the session
list (`fleet-session-question`, `fleet-ci-fixer-row`); until those land they
stay as panels below Usage and Loop.

## Acceptance criteria

- [ ] The header row and the Usage and Loop pair replace the stacked cards.
- [ ] The page has no visible title, keeps a screen-reader `h1`, and its nav
      tab reads Dashboard.
- [ ] The connection pills become dots with labels.
- [ ] The header has a search field (inert until `fleet-palette-search`) and
      a search button shown below 700px.
- [ ] Every element id `dashboard.js` writes to survives, so no rendering
      code changes beyond selectors.
- [ ] Loop's header says when spawning is paused and why.
- [ ] The broadcast and spawn forms stay in place, reachable from the header
      buttons, until `fleet-palette-actions` moves them.

## Verification

- `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job) passes with selector updates only.
- `git diff --stat` shows no change under `app/controllers/` or to a control
  request in `fleet-format.js`.
