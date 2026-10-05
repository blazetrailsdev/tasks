---
title: "trailmap: the reviewer and worker + buttons on a PR row"
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

The reviewer and worker `+` buttons on a PR row: `reviewerLine` (`webhook/dashboard.go:812`) and `workerLine` (`:841`). trailmap#37 draws only the worker pane; the reviewer line is not rendered at all yet (see `render-the-reviewer-line-on-the-dashboard`).

## Acceptance criteria

- [ ] A PR row offers the same add-reviewer and add-worker controls as ringo's, posting to the same endpoints.
