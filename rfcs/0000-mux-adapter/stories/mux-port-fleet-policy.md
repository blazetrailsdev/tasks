---
title: "Port the fleet policy to `lib/mux/fleet.ts`"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-foundation
packages: []
deps:
  - mux-backend-interface-and-tmux-backend
  - mux-port-screen-classifiers
  - mux-pane-registry-and-reconciliation
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The backend-independent half of `sender.go`: the worktree/claude spawn flows (all `Spawn*` variants and the reviewer split), chunked `SendMessage` with `confirmSubmitted`, `PaneStatus`, `PaneInput`, `PaneBlockedByUsage`, the pane-log arm budget, and `AgentStatus`/`SetupAgent` slots.

## Acceptance criteria

- [ ] Every `PaneSender` method has a `Fleet` counterpart
- [ ] Tests run against a `FakeBackend` that records calls and replays screens
- [ ] Message chunking and the submit-confirm retry match the Go timings, with the constants named and documented
