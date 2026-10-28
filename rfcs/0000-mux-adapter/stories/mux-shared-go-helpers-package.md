---
title: "Move `ConductorState`, `ShellQuote` and `ArmBudgetUnlimited` out of `tmux/`"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-foundation
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Retirement needs no consumer to import `btwebooks/tmux` (see the RFC's **Relationship to RFC 0136**).

## Acceptance criteria

- [ ] A new Go package holds the shared types and helpers, and `tmux/` re-exports them for now
- [ ] `webhook/` imports the new package for all three symbols, and the slugify mirror in `spawnloop.go` points at it
