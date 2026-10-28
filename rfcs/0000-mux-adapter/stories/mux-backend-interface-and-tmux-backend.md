---
title: "`MuxBackend` interface and the tmux backend in trailmap `lib/mux/`"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-foundation
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The primitive layer from the RFC's **`MuxBackend`** section. It ports every tmux verb `tmuxCmd`/`spawnPane` issue today (52 call sites), parsing `-F` output into `PaneInfo` in one place.

## Acceptance criteria

- [ ] `lib/mux/backend.ts` exports the interface as in the RFC, with `reportsLiveCwd`
- [ ] `lib/mux/tmux.ts` implements it with `execFile` (no shell), taking `{ bin, socket }`
- [ ] Unit tests use a fake `execFile` and cover each verb's argv and output parsing
- [ ] No code outside `tmux.ts` builds a tmux argv
