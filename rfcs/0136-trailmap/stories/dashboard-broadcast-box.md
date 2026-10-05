---
title: "trailmap: the dashboard's broadcast box"
status: draft
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `port-the-dashboards-control-surface`, whose first slice (the per-row merge, dismiss, clear-failed and respawn-fixer buttons) landed in trailmap#37. Same shape as that slice: the control posts to ringo, which keeps the state; a button is drawn by `control` and carries `data-action`; `controlRequest` and `controlOutcome` in `app/assets/javascripts/fleet-format.js` decide the request and what the button shows, and are unit-tested; `app/assets/javascripts/dashboard.js` has the one click listener. `webhook/dashboard.go` is not touched.

The broadcast box: `sendBroadcast` and `refreshBroadcastCounts` (`webhook/dashboard.go:1994-2030`), with the `all` and `CI red` audiences and live counts from `GET /broadcast/targets`.

## Acceptance criteria

- [ ] A broadcast can be sent to either audience, with the live counts shown.
- [ ] The request and its outcome are unit-tested.
