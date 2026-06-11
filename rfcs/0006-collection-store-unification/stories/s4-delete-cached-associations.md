---
rfc: "0006-collection-store-unification"
title: "Delete _cachedAssociations and resolve singular-association cache"
status: done
updated: 2026-06-11
cluster: associations
deps: ["s3-migrate-findtarget-reads"]
est-loc: 200
priority: 3
pr: 15
claim: "2026-06-10T22:04:33Z"
assignee: "s4-delete-cached-associations"
blocked-by: null
---

# S4 — Delete \_cachedAssociations and resolve singular-association cache

## Goal

Remove the `_cachedAssociations` map now that has_many no longer uses it, and
decide the singular-association story per the RFC proposal: either keep a
narrow generic single-record cache (option A) or move it to a
`SingularAssociation`-style holder (option B). Clean up the six test files that
poke `_cachedAssociations`.

## Acceptance

- `_cachedAssociations` is gone for has_many; has_one / belongs_to cache lives
  in whichever store option A/B was chosen, documented in the PR body.
- The six test pokes either compile against an internal
  `record._associationCache(name)` shim with the same shape, or are updated —
  with no test renames.
- All association tests pass.
- `api:compare` delta non-negative.

## Notes

This is the riskiest story (touches the singular path + tests). If option B
exceeds the 500-LOC ceiling, ship option A here and split B into a follow-up
story off `main`.
