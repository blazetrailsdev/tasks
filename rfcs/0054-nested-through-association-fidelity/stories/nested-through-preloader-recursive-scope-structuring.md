---
title: "Converge nested-through preloader to Rails' recursive per-reflection scope structuring (drop upfront flatten+strip)"
status: done
updated: 2026-07-06
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 5
pr: 4692
claim: "2026-07-06T18:38:56Z"
assignee: "nested-through-preloader-recursive-scope-structuring"
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #4663 (nested-through-scope-column-alias-subquery).

trails' `Preloader::ThroughAssociation` builds a _flattened_ reflection scope
upfront: `reflection.joinScopes` concatenates the entire chain's scopes
(`reflection.ts:1673-1676`), so a nested-through's outer scope carries the
sub-chain's own intermediate-table predicates (e.g. `misc_post_first_blue_tags_2`
flattens `first_blue_tags_2`'s `taggings.comment = 'first'`). PR #4663 patches
the resulting `no such column: taggings.comment` leak by _stripping_ predicates
that qualify the source reflection's own through-chain intermediate tables
before propagating the source scope
(`packages/activerecord/src/associations/preloader/through-association.ts`,
`_getSourcePreloaders` + `_sourceChainIntermediateTables`).

Rails avoids this entirely: `Preloader::ThroughAssociation` structures
nested-through preloading _recursively per-reflection_
(`through_association.rb` — `source_preloaders` spawns a fresh `Preloader` on
`source_reflection.name`), so each reflection routes its own scope to its own
through/source query and no upfront flattening + stripping is needed. The strip
is a correct patch within the existing flattened design but is a heuristic
(it assumes every stripped intermediate predicate is re-derived by the nested
through) rather than architectural parity.

Observable divergences the strip leaves in place:

- The nested-through preload issues one query per chain stage
  (authors + posts + taggings + tags = 4) where Rails' collapsed preload
  asserts 2 (`nested_through_associations_test.rb:562`); the port pins 4 in
  `nested-through-associations.test.ts` with an inline rationale.
- A pathological scope where the _outer_ reflection (not the sub-chain) itself
  qualifies a sub-chain intermediate table would have its predicate stripped
  and silently dropped — no canonical model hits this, but it is a latent gap.

## Acceptance criteria

- Converge `Preloader::ThroughAssociation` to Rails' recursive per-reflection
  scope structuring so intermediate-table predicates resolve at their own
  chain stage without upfront flattening + `_sourceChainIntermediateTables`
  stripping.
- Remove `_sourceChainIntermediateTables` / the strip block once the recursive
  structure makes it unnecessary.
- The three source-association tests in `nested-through-associations.test.ts`
  stay green; revisit the pinned query count if the recursive structure changes
  the stage count.
