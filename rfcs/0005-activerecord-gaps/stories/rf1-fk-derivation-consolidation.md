---
title: "RF1 — fold four derive_foreign_key reimplementations into one helper"
status: done
updated: 2026-06-04
rfc: "0005-activerecord-gaps"
cluster: relation
deps: []
deps-rfc: []
est-loc: 60
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Four near-identical FK-derivation reimplementations exist in `relation.ts`:
`_resolveAssociationTarget`, `_resolveHasManySubquery`, `_resolveHasManyJoin`,
`_resolveAssociationJoin`. Consolidate them into a single helper.

## Acceptance criteria

- [ ] FK derivation consolidated into one helper in `relation.ts`
- [ ] The four call sites use the helper
- [ ] Test sweep of the joins-string resolver's through / HABTM / STI branches

## Notes

From the relation gap plan (RF1), ready now.
