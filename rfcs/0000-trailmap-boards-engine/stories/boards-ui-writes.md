---
title: "Board UI writes: drag to move or reorder, edit description, comment, checklists"
status: draft
updated: 2026-11-11
rfc: "0000-trailmap-boards-engine"
cluster: flip
packages: []
deps: [boards-authority-switch, boards-card-page]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 3 only. Dragging a card between lists is the move verb for that list's
role, with the same guards: a move to `done` needs a PR attachment, and a
move to `ready` with unsatisfied dependencies is refused. Dragging within a
list writes one position. `desc` editing records before and after text in
the `Action`.

## Acceptance criteria

- [ ] Every write goes through the same model verbs as the API, never a direct update
- [ ] Controls are hidden and refused while the authority is `tasks`
- [ ] Screenshots of each interaction in the PR body
