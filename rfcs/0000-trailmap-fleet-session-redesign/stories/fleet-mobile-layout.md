---
title: "trailmap: full-bleed Fleet layout below 700px"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-shell
packages: [actionview]
deps: [fleet-top-panels-grid, fleet-session-list, fleet-session-detail]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The concept's mobile screenshots (trailmap#136,
`screenshots/b-stepper-mobile-*.png`, `b-search-mobile.png`) show the target:
full-bleed panels and cards, one column, the stage header hidden, the current
stage named under each stepper, and the palette as a full-screen sheet.

## Acceptance criteria

- [ ] Below 700px the panels and cards span the viewport edge to edge, in one
      column.
- [ ] The top bar collapses to the logo, a search button and the avatar.
- [ ] Each card names its current stage under the stepper.
- [ ] At 390px `document.documentElement.scrollWidth` is 390 on the page, with
      one card expanded and with the palette open, asserted in the e2e
      suite.

## Verification

- `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job) at a 390×844 viewport, asserting the `scrollWidth` in three states.
