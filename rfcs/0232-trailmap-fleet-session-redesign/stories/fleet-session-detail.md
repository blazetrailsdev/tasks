---
title: "trailmap: expand a session card to its controls, event log and details"
status: draft
updated: 2026-11-10
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-session-detail
packages: [actionview, actionpack]
deps: [fleet-session-card]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`fleet-session-card` keeps today's row controls inline. This story moves
them into an expanded card, as the RFC's "Expanding a session" describes,
alongside an event log built from envelope frames (`fleet/socket`,
`FleetController#socket`, `app/controllers/fleet-controller.ts:54`).

## Acceptance criteria

- [ ] A card expands and collapses by click and by Enter or Space, with
      `aria-expanded`.
- [ ] The expanded card carries the worker and reviewer pane lines, cleanup
      and queued notifications, which leave the collapsed card in the same
      PR.
- [ ] The details show the RFC, branch, a diff bar against the LOC ceiling,
      review progress (`reviewCycles`, `openFindings`), CI (`ciStatus`) and
      Open pane, and nothing the envelope or tasks database does not carry.
- [ ] The log lists that session's stage changes and PR events with
      timestamps, recorded as frames arrive and kept for the page's life. A
      cold load says "since <time>".

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js` for the frame-diff recorder, and `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job) for expand, collapse and
  every relocated control.
