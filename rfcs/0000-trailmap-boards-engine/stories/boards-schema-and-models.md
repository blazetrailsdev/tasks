---
title: "Boards schema and models: Workspace, Board, List, Card and their relations"
status: draft
updated: 2026-11-11
rfc: "0000-trailmap-boards-engine"
cluster: engine
packages: []
deps: [boards-engine-skeleton]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The RFC's data-model table. Ids are strings equal to the RFC or story id. A
`List` carries a `role` (`draft`, `ready`, `claimed`, `in-progress`, `blocked`,
`done`), and a board is seeded with one list per role. `CardRelation` holds the
card-to-card and card-to-board dependencies.

## Acceptance criteria

- [ ] Migrations and models for Workspace, Board, List, Card, Label, CardLabel, Member, CardMember, Attachment, CardRelation, Comment, Checklist, CheckItem, Action and Meta
- [ ] `Board` creation seeds the six role lists; `List.forRole(board, role)` resolves by role, not name
- [ ] Associations and validations (unique `[boardId, role]`, relation `targetType` in `Card`/`Board`)
- [ ] Model tests under `engines/boards/test/models`
