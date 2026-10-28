---
title: "Migrate stored pane ids to `PaneRef` and add `/whoami` for scripts"
status: draft
updated: 2026-10-28
rfc: "0210-mux-adapter"
cluster: mux-cutover
packages: []
deps:
  - mux-cutover-spawn
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Stored state (tracker, cleanup queue, session archive, trailmap `isPaneId`) moves from `%123` to `<instance>/%123`. Scripts stop reading `$TMUX_PANE` directly.

## Acceptance criteria

- [ ] A one-shot migration rewrites the stored ids, and readers accept both forms during the transition
- [ ] `hooks/ringo-ask.sh`, `skills-link` and the archived skills resolve the pane through `GET /whoami`
- [ ] `rg TMUX_PANE` across btwebooks hooks and skills returns 0
