---
title: "trailmap: the dashboard's Claude and Codex usage bars"
status: draft
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `port-the-dashboards-control-surface`, whose first slice (the per-row merge, dismiss, clear-failed and respawn-fixer buttons) landed in trailmap#37. Same shape as that slice: the control posts to ringo, which keeps the state; a button is drawn by `control` and carries `data-action`; `controlRequest` and `controlOutcome` in `app/assets/javascripts/fleet-format.js` decide the request and what the button shows, and are unit-tested; `app/assets/javascripts/dashboard.js` has the one click listener. `webhook/dashboard.go` is not touched.

The usage bars, Claude and Codex: `renderUsage` (`webhook/dashboard.go:1426`), `renderCodexUsage` (`:1556`) and the helpers `barColor`, `weeklyPaceColor`, `parseResetDate`, `weekElapsedPercent`, `renderDayMarkers` (`:1288-1425`); markup at `:371-430`. Read-only, about 250 lines of ringo JS, nearly all of it pure.

## Acceptance criteria

- [ ] Both usage panels render from the event stream as ringo's do.
- [ ] The colour, pace and date helpers are in `fleet-format.js` with unit tests.
