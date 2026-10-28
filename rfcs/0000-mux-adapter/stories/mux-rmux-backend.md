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

A probe against rmux 0.7.1 found no differences in any tmux command `sender.go` uses (RFC open question 2). This story makes that permanent: `RmuxBackend` is `TmuxBackend` with `bin: "rmux"`.

## Acceptance criteria

- [ ] `lib/mux/rmux.ts` passes the contract suite
- [ ] Instance config rejects an `-S` socket path longer than the Unix socket-path limit and points to `-L`
- [ ] A 3-day run of the fleet on an rmux instance meets G4-level failure rates
