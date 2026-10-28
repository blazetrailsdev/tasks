---
title: "Command-trace differential: Go `Sender` vs TS `Fleet` (G2)"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-foundation
packages: []
deps:
  - mux-port-fleet-policy
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Gate G2. A fake `tmux` script logs argv as JSONL and replays canned output. The same scenarios run through both implementations.

## Acceptance criteria

- [ ] The shim and a scenario runner cover these 9 scenarios: spawn worker, spawn named, spawn on branch, spawn reviewer (split), find by branch, find by PR, long chunked message, kill and cleanup, agent setup and slot move
- [ ] Normalization of pane ids, temp paths and timestamps is documented
- [ ] The diff is 0 lines on all 9, and CI runs it on changes to either side
