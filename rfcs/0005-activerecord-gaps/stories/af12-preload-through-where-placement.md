---
title: "AF12 — fix through-WHERE placement in includes-only preload path"
status: ready
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 50
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

In `preloader/through-association.ts` `_buildThroughScope`, the
`reflection_scope.where_clause` is copied onto the SOURCE query when it should go
onto the THROUGH query (~lines 180-193 and 362-396). The AF6 prerequisite is
satisfied (#2652).

## Acceptance criteria

- [ ] `reflection_scope.where_clause` copied onto the THROUGH query, not the
      SOURCE query
- [ ] Includes-only preload path produces correct WHERE placement
- [ ] Regression test for the through-WHERE case

## Notes

From the associations gap plan (AF12), ready now.
