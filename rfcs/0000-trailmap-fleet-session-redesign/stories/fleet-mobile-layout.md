---
title: "trailmap: full-bleed Fleet layout below 700px"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-shell
packages: [actionview]
deps: [fleet-top-panels-grid, fleet-session-grouping, fleet-session-detail, fleet-palette-search]
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
`screenshots/b-stepper-mobile-*.png`, `b-search-mobile.png`) show the target
the RFC's "Mobile" describes.

## Acceptance criteria

- [ ] Below 700px, panels and cards span the viewport edge to edge, in one
      column.
- [ ] The top bar shows the logo and the search button built by
      `fleet-top-panels-grid`.
- [ ] The stage header is hidden, and each card names its current stage
      under its stepper.
- [ ] The palette opens as a full-screen sheet.

## Verification

- `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job) at a 390×844 viewport asserts `document.documentElement.scrollWidth
=== 390` collapsed, with a card expanded and with the palette open.
