---
title: "trailmap: expand a session card to its event log and details"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-session-detail
packages: []
deps: [fleet-session-list]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The concept card (trailmap#136) expands to a log on the left and details on
the right: RFC, branch, a diff bar against the LOC ceiling, reviewer or CI
progress, and Open pane. trailmap has no session transcript. What it sees is
the envelope stream (`fleet/socket`, `FleetController#socket`,
`app/controllers/fleet-controller.ts:54`).

## Acceptance criteria

- [ ] A card expands and collapses by click and by Enter/Space, with
      `aria-expanded`.
- [ ] The log lists that session's stage changes and PR events (opened,
      reviewed, CI failed, merged) with timestamps, recorded as frames arrive
      and kept for the life of the page. A cold load shows "since <time>".
- [ ] The details show only what the collapsed card does not: RFC, branch,
      diff bar, review or CI progress, Open pane.
- [ ] Unit tests cover the event recorder's diffing of two frames.
