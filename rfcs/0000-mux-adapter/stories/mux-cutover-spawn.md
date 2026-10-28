---
title: "Cut over spawns to `muxd`"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-cutover
packages: []
deps:
  - mux-cutover-send-message
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Covers the spawn loop's worker spawns, reviewer splits and agent setup. The spawn loop itself stays in ringo.

## Acceptance criteria

- [ ] The spawn flag is on, with rollback
- [ ] G4 is met for spawns, and every spawned pane is registered with repo/branch
