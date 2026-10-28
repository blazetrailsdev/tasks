---
title: "Cut over message delivery to `muxd`"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-cutover
packages: []
deps:
  - mux-shadow-soak-and-mismatch-report
  - mux-trace-differential
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The first write. Gated by G2 and G3, and soaked against G4.

## Acceptance criteria

- [ ] The send-message flag is on, with a one-flag rollback
- [ ] G4 is met: 3 days, ≥ 50 sends, failure rate ≤ the Go baseline, 0 lost messages
