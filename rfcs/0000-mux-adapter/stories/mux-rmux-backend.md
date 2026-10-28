---
title: "rmux backend"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-backends
packages: []
deps:
  - mux-backend-contract-suite
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Open question 1 of the RFC. First try rmux as a drop-in through its tmux shim; otherwise subclass `TmuxBackend`.

## Acceptance criteria

- [ ] `lib/mux/rmux.ts` passes the contract suite
- [ ] Open question 1 is answered in the RFC (formats, `pipe-pane`)
- [ ] A 3-day run of the fleet on an rmux instance meets G4-level failure rates
