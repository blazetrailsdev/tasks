---
title: "ringo: report in-flight refine and sunset spawns per RFC"
status: draft
updated: 2026-11-19
rfc: "0000-ringo-changes"
cluster: rfc-sessions
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`HandleRFCRefine` (`webhook/spawnloop.go:3602`) spawns refine and sunset
agents via `spawnRFCRefine` (`webhook/rfcautorefine.go:147`), which already
calls `recordRFCSpawnProvenance` and `registerRFCSpawn`. trailmap's RFC page
cannot ask "is a refine or sunset running on this RFC right now, and in which
pane", so it can only show the report after it lands (`POST /rfc-refines`,
trailmap `app/controllers/rfc-refines-controller.ts`).

## Acceptance criteria

- `GET /api/rfc-spawns?slug=<rfc>` answers the RFC's live and recently
  finished (pane exited within the last 30 minutes, configurable)
  refine/sunset spawns: `{mode: refine|sunset, pane, startedAt,
state: running|done}`.
- Spawn start and pane exit emit `/events` messages carrying the slug and
  mode.
- Go tests cover a refine and a sunset on the same RFC listed separately, and a
  `done` spawn dropping off after the 30-minute window.
