---
title: "trailmap: Fleet header row and two-column panel grid"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
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
`#spawnLoopPanel`, the broadcast card and `#spawnPanel`. `dashboard.js` fills
them by id. The concept in trailmap#136 (`b-stepper-list.html`) puts the title
and pills in one header row, with Broadcast and Spawn buttons, and pairs the
panels on one grid: Waiting on you with Usage, CI fixer with Loop. Pause sits
inside Loop.

## Acceptance criteria

- [ ] The header row and the two-column grid replace the stacked cards. Grid
      rows share a height.
- [ ] Every element id `dashboard.js` writes to survives, so no rendering
      code changes beyond selectors.
- [ ] The main-CI state is shown once, in the CI fixer panel; the pill only
      links to it.
- [ ] The broadcast and spawn forms stay reachable from the header buttons
      until `fleet-command-palette` hosts them.
- [ ] The dashboard e2e passes.

## Verification

- `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job) passes with selector updates only.
- `git diff --stat` shows no change under `app/controllers/` or to a control
  request in `fleet-format.js`.
