---
title: "habtm: polymorphic-through, alternate-db, belongs_to-required"
status: claimed
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 150
priority: 30
pr: null
claim: "2026-06-22T22:59:16Z"
assignee: "habtm-residual-features"
blocked-by: null
---

## Context

Part of RFC 0030 test:compare residual burndown, split out of `a4-habtm-join-aliasing`.
Three independent HABTM feature tests in
`packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts`,
each a distinct capability gap:

- `has many through polymorphic has manys works` (~984) — ROOT-CAUSE: through association
  traversal with a polymorphic intermediate is not implemented.
- `alternate database` (~1260) — ROOT-CAUSE: habtm across two databases requires multi-db
  connection routing, not yet implemented.
- `has and belongs to many is usable with belongs to required by default` (~1288) —
  ROOT-CAUSE: `belongs_to_required_by_default` config not consulted when habtm creates its
  implicit belongs_to side.

These can be split further if individually claimed; grouped here as the residual habtm gaps.

## Acceptance criteria

- [ ] Each test un-skipped and green against canonical SQLite (and PG/MySQL per gate),
      or reclassified to a permanent-skip with a recorded reason per the RFC Deferred table.
- [ ] No new gate-mismatches for this file.
