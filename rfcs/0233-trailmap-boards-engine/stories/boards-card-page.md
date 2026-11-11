---
title: "Read-only card page: description, relations, attachments and action log"
status: draft
updated: 2026-11-11
rfc: "0233-trailmap-boards-engine"
cluster: ui
packages: []
deps: [boards-workspace-and-board-pages]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The card counterpart of trailmap's story show page. It renders `desc` as
markdown (reuse whatever `render-markdown-in-trailmap` lands), dependencies
in both directions, PR and path attachments, checklists and the `Action` log.

## Acceptance criteria

- [ ] `/boards/cards/:id` renders every field the story show page renders
- [ ] Dependencies link to their cards and show whether each is satisfied
- [ ] Screenshots in the PR body
