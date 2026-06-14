---
title: "Thread references aliasing through _addThroughViaJoinAssociation"
status: ready
updated: 2026-06-14
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`converge-join-constraints-references` (PR #3253) threaded `references` through
the direct join build path (`addAssociationSpec` → `_buildSpecTree` →
`_addOrReuse` → `addAssociation`) so a referenced association is aliased to its
reference name (`authors AS author`, Rails `@references[reflection.name]`).

`_addThroughViaJoinAssociation` does NOT receive `references`, so through/HMT
chains never get reference-driven aliasing — they only collision-alias to
`t{index}`. Rails applies `@references` uniformly across all reflections in
`make_constraints`. No current test exercises a referenced through-association,
so this is latent rather than a live failure.

## Acceptance criteria

- [ ] `references` threaded into `_addThroughViaJoinAssociation` (from
      `addAssociation`/`_addOrReuse`).
- [ ] A referenced through-association target table aliases to the reference
      name when free, matching Rails.
- [ ] Add a test mirroring a Rails `references(:x)` + through eager_load case.
