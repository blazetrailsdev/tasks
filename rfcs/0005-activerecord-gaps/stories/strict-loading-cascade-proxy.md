---
title: "Strict-loading cascade on collection proxy reader + mode propagation"
status: ready
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 80
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`CollectionProxy#toArray` / `load` bypass `CollectionAssociation.loadTarget`, so
strict_loading does not cascade and the owner's strict-loading mode isn't
propagated onto loaded children.

## Acceptance criteria

- [ ] `CollectionProxy#toArray` / `load` route through
      `CollectionAssociation.loadTarget` so strict_loading cascades
- [ ] Owner strict-loading mode propagated onto loaded children
- [ ] Regression test for the cascade + mode propagation

## Notes

From the associations gap plan (Round-4 follow-up), ready now.
