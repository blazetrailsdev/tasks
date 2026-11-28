---
title: "Campfire example: Action Cable channels on Solid Cable with their tests"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, actioncable, solid-cable]
deps: [campfire-models-rooms-memberships-accounts, campfire-models-users-messages-push]
deps-rfc: []
est-loc: 460
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). `app/channels/` (189 lines):
`ApplicationCable::Connection` identified by `current_user`, and the heartbeat,
presence, read rooms, room, room messages, typing notifications and unread
rooms channels; `test/channels/` (270 lines).

## Acceptance criteria

- [ ] every channel and the connection ported file for file
- [ ] channel tests ported and passing on Solid Cable
- [ ] a test that `remoteConnections.where({ currentUser }).disconnect({ reconnect: true })` closes a member's connection

## Notes

Framework gaps the port finds are filed in the owning package's surfaced-deviations bucket and fixed there, not worked around in the app (RFC § Verification).
