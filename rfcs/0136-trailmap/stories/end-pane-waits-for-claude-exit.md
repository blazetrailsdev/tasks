---
title: "End pane waits for Claude to exit before typing the shell exit"
status: in-progress
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#176
claim: "2026-11-19T12:16:24Z"
assignee: "db-seed-never-exits"
blocked-by: null
closed-reason: null
---

## Context

trailmap#166 added End pane to the expanded dashboard row. `controlRequest("pane-end")` in
`app/assets/javascripts/fleet-format.js` sends `/exit`, and the click handler in
`app/assets/javascripts/dashboard.js` waits a fixed `then.afterMs: 3000` before sending `exit`.
If Claude takes longer than 3s to quit, `exit` is typed into Claude as a prompt and fish stays open.
It was never exercised against a live pane.

## Acceptance criteria

- After `/exit`, the second send waits until the pane's screen (`GET /fleet/pane/:id/screen`) shows
  a shell prompt / no Claude UI, with a timeout, instead of a fixed delay.
- On timeout it reports beside the message box and does not send `exit`.
- Verified once end-to-end on a real pane.
