---
title: "trailmap: the fleet relay opens one ringo connection per viewer"
status: draft
updated: 2026-10-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/fleet-relay.ts` (trailmap#40) opens one connection to ringo's `/events` for every browser
socket. That is the simplest correct shape and it is bounded by the number of open fleet tabs, but
every viewer costs ringo a stream and trailmap a fetch, and each receives the same frames.

ringo's stream is a sequence of whole snapshots, so one upstream read could feed every socket: a
new viewer is sent the last frame at once and then each frame as it arrives; the upstream read
starts with the first viewer and ends with the last.

## Acceptance criteria

- [ ] Any number of viewers hold one upstream connection between them; a test counts it.
- [ ] A viewer joining mid-stream gets the latest frame without waiting for the next.
- [ ] The upstream read ends when the last viewer leaves, and restarts for the next.
