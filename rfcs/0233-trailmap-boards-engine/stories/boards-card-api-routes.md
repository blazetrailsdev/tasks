---
title: "Card and board API routes that delegate to the task-domain verbs"
status: draft
updated: 2026-11-11
rfc: "0233-trailmap-boards-engine"
cluster: cli
packages: []
deps: [boards-schema-and-models, move-mutation-verbs-onto-the-models]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 2. The new vocabulary goes onto the wire while the old system still does
every write. `POST /api/cards/move` with `{ id, to: role, pr }` dispatches to
the matching `Story` verb. Likewise `cards/claim`, `cards/release`,
`cards/archive` (close), `cards/position` (priority) and `boards/state`
(rfc-status). Refusals and exit codes are the `MutationsController` ones
verbatim.

## Acceptance criteria

- [ ] A route per verb, each a thin delegation with a request test
- [ ] A move to a role with no single verb (e.g. `ready` from `blocked`) maps to `status-set`
- [ ] The routes read `meta.authority` and, while it is `tasks`, call `Story` only
