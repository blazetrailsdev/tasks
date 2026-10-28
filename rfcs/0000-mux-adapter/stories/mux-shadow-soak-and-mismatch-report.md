---
title: "Shadow soak and mismatch report (G3)"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-cutover
packages: []
deps:
  - ringo-http-pane-sender-shadow
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Gate G3: 7 consecutive days, ≥ 20,000 comparisons over ≥ 30 panes, 0 unexplained mismatches.

## Acceptance criteria

- [ ] A `parity_mismatches` store and a dashboard page showing counts, distinct panes and the clock
- [ ] Each explained mismatch is added to `parity/screens/` before the clock restarts
- [ ] G3 is met and its numbers are recorded in this story's PR
