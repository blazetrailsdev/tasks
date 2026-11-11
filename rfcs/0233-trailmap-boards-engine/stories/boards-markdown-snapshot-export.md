---
title: "Markdown snapshot export of boards into the tasks repo"
status: draft
updated: 2026-11-11
rfc: "0233-trailmap-boards-engine"
cluster: retire
packages: []
deps: [boards-authority-switch]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Prose lives only in the DB from phase 3, so give it a git history. A
scheduled job renders each board and card to markdown in the tasks repo
layout and commits the snapshot. It is one-way: nothing ingests it.

## Acceptance criteria

- [ ] Running the export twice with no changes commits nothing
- [ ] The snapshot round-trips every field shown on the card page
- [ ] Recurring daily
