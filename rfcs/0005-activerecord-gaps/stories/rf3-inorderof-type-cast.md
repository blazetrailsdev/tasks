---
title: "RF3 — add type_cast_for_database value casting in inOrderOf"
status: done
rfc: "0005-activerecord-gaps"
cluster: relation
deps: []
deps-rfc: []
est-loc: 20
priority: 14
pr: 2671
claim: null
assignee: null
blocked-by: null
---

## Context

`inOrderOf` does not cast its values through `type_cast_for_database`. Wire it in
`relation.ts` / `relation/query-methods.ts`.

## Acceptance criteria

- [ ] `inOrderOf` casts values via `type_cast_for_database`
- [ ] Test with a typed-column caller

## Notes

From the relation gap plan (RF3), ready, low urgency (surfaces once a typed-column
caller exposes the gap).
