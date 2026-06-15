---
title: "update_all/delete_all preserve default-scope JOIN via subquery"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: relation-scoping
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b1-relation-scoping (PR #3413).
`update_all`/`delete_all` on a relation whose default scope joins another table
drop the JOIN, so a WHERE referencing the joined column fails
("no such column: projects.name"). Rails rewrites these as a subquery
(`UPDATE ... WHERE id IN (SELECT id ... JOIN ...)`) when the relation has joins.

Blocks (it.skip in scoping/relation-scoping.test.ts):

- `update all default scope filters on joins`
- `delete all default scope filters on joins`

Reference: DeveloperFilteredOnJoins (test-helpers/models/developer.ts) —
`default_scope { joins(:projects).where(projects: { name: "Active Controller" }) }`.

## Acceptance criteria

- `update_all`/`delete_all` on a joined relation emit the Rails subquery form so
  the default-scope JOIN predicate is honored.
- Un-skip the two cases above.
