---
title: "dashboard-e2e covers the Send suggestion button and its repaint"
status: draft
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap PR 182 added a Send suggestion button to an expanded live session's
composer. `suggestHtml` (app/assets/javascripts/fleet-sessions.js) draws it,
and `paintTerminal` (app/assets/javascripts/dashboard.js, the `[data-suggest]`
slot block) repaints it on each screen poll, only when the suggestion changes
and never while its button is disabled mid-send. The unit tests cover
`suggestedMessage`/`suggestHtml`/`controlOutcome`. Nothing exercises the DOM
wiring: scripts/dashboard-e2e.ts has no pane screen and never expands a live row.
PR 182 checked it by hand over CDP against `pnpm ringo:stub`, whose dashboard.json
now has a `/pane/11/screen` with a dimmed suggestion.

## Acceptance criteria

- dashboard-e2e serves a pane screen with a dimmed suggestion, expands that row,
  and asserts a "Send suggestion" button with the suggestion beside it.
- Clicking it POSTs `{ text: <suggestion> }` to `/fleet/pane/<n>/send`; while in
  flight the button reads "Sending…", the status region is sr-only with
  "Sending message", and a screen poll does not repaint the slot.
- After the answer the label is "Send suggestion" again, and a later screen
  with no suggestion removes the button.
