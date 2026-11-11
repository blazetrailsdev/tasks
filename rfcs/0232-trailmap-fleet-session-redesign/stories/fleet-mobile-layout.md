---
title: "trailmap: full-bleed dashboard layout below 700px"
status: draft
updated: 2026-11-10
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-shell
packages: [actionview]
deps:
  [
    fleet-top-panels-grid,
    fleet-session-grouping,
    fleet-session-detail,
    fleet-palette-search,
    fleet-session-question,
    fleet-session-stall,
  ]
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
- [ ] The stage header keeps only the filter chips, and each row names its
      current stage and progress figure under its stepper.
- [ ] Usage and Loop fold to a one-line summary and open on tap. On a wide
      page they are always open and their summary is out of the tab order;
      crossing 700px re-applies both.
- [ ] Question and stall strips stack their controls.
- [ ] The palette opens as a full-screen sheet.

## Verification

- `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job) at a 390×844 viewport asserts `document.documentElement.scrollWidth
=== 390` collapsed, with a card expanded and with the palette open.
