---
title: "Replay task-domain events into boards since a stored cursor"
status: draft
updated: 2026-11-11
rfc: "0000-trailmap-boards-engine"
cluster: mirror
packages: []
deps: [boards-mirror-full-reconcile]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The nightly reconcile leaves the board UI up to a day stale. Instead, replay
`events` rows since `meta.mirrorCursor` every minute. Each event becomes a
card move or update plus an `Action` with the same actor and timestamp. An
event the mirror cannot interpret is logged and left for the full reconcile.

## Acceptance criteria

- [ ] Every verb in `events.verb` maps to an `Action` type, with a table test
- [ ] The cursor advances in the same transaction as the writes
- [ ] Recurring every minute; overlapping runs cannot double-apply
- [ ] When the authority is `boards`, the job does nothing (see `boards-authority-switch`)
