---
title: "Contract suite every `MuxBackend` must pass"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-backends
packages: []
deps:
  - mux-backend-interface-and-tmux-backend
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Backends are checked against the TS tmux backend, not against Go.

## Acceptance criteria

- [ ] `test/lib/mux/contract.test.ts` runs spawn, list, send-text, send-keys, capture, rename, exists, kill and (if supported) pipe on each configured backend
- [ ] Backends whose binary or socket is missing are skipped, and the tmux backend runs in CI
