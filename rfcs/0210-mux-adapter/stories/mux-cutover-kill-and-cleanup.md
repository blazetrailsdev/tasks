---
title: "Cut over kill and cleanup to `muxd`"
status: draft
updated: 2026-10-28
rfc: "0210-mux-adapter"
cluster: mux-cutover
packages: []
deps:
  - mux-cutover-spawn
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Covers the cleanup queue, the tracker's merged-row drop, and the claim and worktree sweeps.

## Acceptance criteria

- [ ] The kill flag is on, with rollback
- [ ] G4 is met, and no pane is killed through a stale or recycled ref (tested against the registry)
