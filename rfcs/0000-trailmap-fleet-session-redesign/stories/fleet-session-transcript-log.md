---
title: "trailmap: tool calls and messages in the session log"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-session-detail
packages: []
deps: [fleet-session-detail]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`fleet-session-detail` builds the log from envelope events only. The
concept's log (trailmap#136) also shows tool calls, agent messages and user
messages, which only the session's transcript holds. The RFC's open question
2 decides where trailmap reads it.

## Acceptance criteria

- [ ] Open question 2 is answered, and any ringo endpoint is filed in ringo.
- [ ] The expanded log merges transcript entries (tool calls, agent and user
      messages) with the envelope events, in time order.
- [ ] The log loads lazily on expand and pages back on scroll.
- [ ] Nothing from the transcript is sent beyond the viewer's browser.
