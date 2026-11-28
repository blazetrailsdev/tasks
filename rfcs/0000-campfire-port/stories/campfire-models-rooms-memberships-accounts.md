---
title: "Campfire example: Room, Rooms::*, Membership and Account models with their tests"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, activerecord, actioncable]
deps: [campfire-app-skeleton]
deps-rfc: []
est-loc: 1400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). `app/models/room.rb` (119 lines), `room/` (155),
`rooms/` (37), `membership.rb` and `membership/` (76), `account.rb` and
`account/`; tests `test/models/room*`, `rooms/`, `membership_test.rb`,
`account*` (about 920 lines). `Room#destroy_later` uses `becomes!` across STI
and `Room#reset_remote_connections_of` reaches
`ActionCable.server.remoteConnections` (ported,
`packages/actioncable/lib/remote-connections.ts`).

## Acceptance criteria

- [ ] each listed model and concern ported file for file
- [ ] each listed test file ported and passing on SQLite

## Notes

Framework gaps the port finds are filed in the owning package's surfaced-deviations bucket and fixed there, not worked around in the app (RFC § Verification).
