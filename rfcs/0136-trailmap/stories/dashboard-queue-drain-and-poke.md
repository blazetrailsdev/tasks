---
title: "trailmap: the dashboard's queue, drain and poke controls"
status: draft
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `port-the-dashboards-control-surface`, whose first slice (the per-row merge, dismiss, clear-failed and respawn-fixer buttons) landed in trailmap#37. Same shape as that slice: the control posts to ringo, which keeps the state; a button is drawn by `control` and carries `data-action`; `controlRequest` and `controlOutcome` in `app/assets/javascripts/fleet-format.js` decide the request and what the button shows, and are unit-tested; `app/assets/javascripts/dashboard.js` has the one click listener. `webhook/dashboard.go` is not touched.

Queue, drain and poke: `renderQueue` (`webhook/dashboard.go:1767`), `drainQueue`, `sendOne`, `drainCodexReviewers` and `drainClaudeReviewers` (`:964`), `pokeStalled` and `updatePokeButton` (`:2119-2146`).

## Acceptance criteria

- [ ] The queue renders under its PR row and each control posts what ringo's does.
- [ ] The poke button's enabled state is a pure function with tests.
