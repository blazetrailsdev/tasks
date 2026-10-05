---
title: "trailmap: the dashboard's spawn-loop settings panel"
status: draft
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `port-the-dashboards-control-surface`, whose first slice (the per-row merge, dismiss, clear-failed and respawn-fixer buttons) landed in trailmap#37. Same shape as that slice: the control posts to ringo, which keeps the state; a button is drawn by `control` and carries `data-action`; `controlRequest` and `controlOutcome` in `app/assets/javascripts/fleet-format.js` decide the request and what the button shows, and are unit-tested; `app/assets/javascripts/dashboard.js` has the one click listener. `webhook/dashboard.go` is not touched.

The spawn-loop settings panel: `renderSpawnLoop` (`webhook/dashboard.go:2181`), `toggleSpawnLoop`, `setSpawnLoopCap`, `skipNext`, `spawnLoopNow`; markup at `:437-470`. Live cap, queue cap, interval, bundle mode, next story and skip.

## Acceptance criteria

- [ ] The panel shows the loop's state and each control posts what ringo's does.
- [ ] Disabled and in-flight states go through `controlOutcome`.
