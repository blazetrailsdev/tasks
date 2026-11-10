---
title: "trailmap: message a session from its expanded card"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-session-detail
packages: []
deps: [fleet-session-detail]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`POST fleet/pane/:id/send` (`config/routes.ts:76`, `FleetController#message`,
`app/controllers/fleet-controller.ts:135`) types a line into a pane, and only
the pane page calls it today (`app/assets/javascripts/pane.js`).

## Acceptance criteria

- [ ] An expanded card for a live session has a message box that posts to
      `fleet/pane/:id/send`, and ⌘↵ sends.
- [ ] Sent text appears in the session log as a user entry. A failure shows
      the controller's error inline.
- [ ] A merged or paneless session shows no message box.
- [ ] The e2e suite sends one message through the box.
