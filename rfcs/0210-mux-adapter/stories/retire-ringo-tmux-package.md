---
title: "Retire `btwebooks/tmux/`"
status: draft
updated: 2026-10-28
rfc: "0210-mux-adapter"
cluster: mux-cutover
packages: []
deps:
  - mux-cutover-pane-logs
  - mux-pane-ref-migration-and-whoami
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Gate G5.

## Acceptance criteria

- [ ] Every consumer in the RFC's table runs on `muxclient`
- [ ] `main.go` builds no `tmux.Sender`, and `tmux/`, the fake-tmux shim and `MUX_MODE=go` are deleted
- [ ] All G4 flags have been on for 7 days before merge
