---
title: "trailmap: carry the over-LOC label and loop running/paused once the loop's configuration has a cheap home"
status: blocked
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  - serve-the-spawnloop-json-endpoints
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: "No cheap named read of the loop config exists yet (ringo /spawnloop/config is 2s, /spawnloop/backlog 3MB); dashboard-spawn-loop-settings is done but gave none. Held on serve-the-spawnloop-json-endpoints."
closed-reason: null
---

## Context

trailmap#63 carried two of ringo's four list-page signals ("needs refine", the
bar's history ticks) and deliberately left two: the over-LOC label on
`/backlog` rows and the loop running/paused indicator. Both are facts about the
LOOP (`sl.cfg.MaxLOC`, `sl.cfg.Enabled`), and ringo's only sources for them
cannot be read while a page renders: `GET /spawnloop/config` computes the next
bundle and took 2.0–2.4s per call (measured 2026-10-12 from the trailmap
container), and `/spawnloop/backlog` is a 3MB payload. The reason is recorded
in `app/controllers/story-pages-controller.ts` (`index`).

`dashboard-spawn-loop-settings` and `serve-the-spawnloop-json-endpoints` are
where the configuration is likely to land in trailmap; this depends on
whichever gives it a cheap, named read.

## Acceptance criteria

- [ ] `/backlog` marks `~N LOC` when a story exceeds the spawn ceiling, read from the loop's configuration and not a copied number
- [ ] `/backlog` says whether the loop is running or paused, and says nothing when the source is unreachable
- [ ] Neither adds a slow or large request to the page's render
