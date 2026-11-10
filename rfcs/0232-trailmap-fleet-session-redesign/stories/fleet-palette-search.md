---
title: "trailmap: ⌘K palette searching sessions, stories and PRs"
status: draft
updated: 2026-11-10
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-search
packages: [actionview, activerecord]
deps: [fleet-top-panels-grid, fleet-session-bundle-stories]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The concept (trailmap#136, `b-stepper-list.html?search=1`) shows the
palette. The RFC's "Search" splits it: this story is the dialog and the
search, and `fleet-palette-actions` adds actions.

## Acceptance criteria

- [ ] ⌘K or Ctrl+K, the header search field and the search button open the
      palette, and Esc closes it. It is a dialog with focus trapped while
      open.
- [ ] Sessions and PRs are matched in the browser from the current
      envelope. Stories come from `GET fleet/stories?q=<text>`, at most 20,
      matched on id and title.
- [ ] Results are grouped by kind with the top one selected. ↑ and ↓ move,
      ↵ opens. Scope chips filter by kind and repo, and matches are
      highlighted.

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js` for matching and ranking, `pnpm vitest run
test/controllers/fleet-controller.test.ts` for `?q=`, and `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job) for open,
  navigate and Esc.
