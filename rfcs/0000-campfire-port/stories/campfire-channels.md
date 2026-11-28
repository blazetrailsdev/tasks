---
title: "Campfire example: Action Cable channels on Solid Cable"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: []
deps: [campfire-models-and-migrations]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. `app/channels`: `ApplicationCable::Connection` identified by
`current_user`, and heartbeat, presence, read rooms, room, room messages,
typing notifications and unread rooms channels. `config/cable.yml` uses
Redis; the port uses Solid Cable.

## Acceptance criteria

- [ ] every channel ported; `cable.yml` on solid_cable with the change receipted
- [ ] channel tests ported and passing
- [ ] `remoteConnections.where({ currentUser }).disconnect` closes a member's socket in a test
