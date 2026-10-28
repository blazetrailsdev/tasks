---
title: "Cut over pane-log arming to `muxd`"
status: draft
updated: 2026-10-28
rfc: "0210-mux-adapter"
cluster: mux-cutover
packages: []
deps:
  - mux-cutover-kill-and-cleanup
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`pipe-pane` arming and the arm budget for the session archive.

## Acceptance criteria

- [ ] The pane-log flag is on, with rollback
- [ ] For panes in the cutover window, archive byte counts match the Go baseline within 1 %
