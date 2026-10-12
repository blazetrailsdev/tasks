---
title: "trailmap: the dashboard's pause button and usage-scraper pill"
status: draft
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#65 ported ringo's usage panels but left two controls that live beside
them in `webhook/dashboard.go` (ringo 541e0cc):

- The pause button: `togglePause` (`:1921`) posts `/pause {paused}`; `renderUsage`
  (`:1543-1546`) labels it Pause / Resume from `u.manualPause`. trailmap already
  shows "MANUAL PAUSE (n queued)" but offers no way to pause or resume.
- The usage-scraper pill: `watchPill` (`:347`), coloured on / stale / off by
  `renderUsage` (`:1592-1605`) from `watchConnected`, `stale`, `lastCheckTime`,
  `lastError`; clicking it posts `/refresh-usage` (`refreshUsageNow`, `:1844`).

Same shape as the other controls: `control` draws the button, `controlRequest`
/ `controlOutcome` in `app/assets/javascripts/fleet-format.js` decide the
request, paths are added to `FLEET_CONTROLS`, and the state comes from the
existing `usage` poll.

## Acceptance criteria

- [ ] Pause / Resume posts `/pause` and reflects `manualPause` from the usage answer.
- [ ] The scraper pill shows on / stale / off with ringo's title text, and a click refreshes usage.
- [ ] The pill's state is a pure function with tests.
- [ ] PR body carries screenshots.
