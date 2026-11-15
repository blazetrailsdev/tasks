---
title: "A live session's expanded card shows its event log beside the terminal"
status: done
updated: 2026-11-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trailmap#142
claim: "2026-11-15T22:06:25Z"
assignee: "live-session-card-shows-its-event-log"
blocked-by: null
closed-reason: null
---

Found while working on trailmap#141. An expanded live session now shows its worker pane's terminal in place of the session log (`sessionDetail`, `app/assets/javascripts/fleet-sessions.js`; the operator chose this over a transcript log). What the log recorded for a live session is no longer visible anywhere: stage changes, PR events (reviewed, CI failed) and the operator's own sent messages (`log-you`, recorded by `frameEvents` and the composer). A merged session still shows it.

Expected: a live card shows both. For example, a compact event strip or a "Log" tab beside the terminal, using the same `logHtml`. The e2e case "message a session from its expanded card" asserts the sent line is visible again.
