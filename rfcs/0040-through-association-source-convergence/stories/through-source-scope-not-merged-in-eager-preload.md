---
title: "through-source-scope-not-merged-in-eager-preload"
status: claimed
updated: 2026-06-23
rfc: "0040-through-association-source-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: "2026-06-23T23:30:39Z"
assignee: "through-source-scope-not-merged-in-eager-preload"
blocked-by: null
---

## Context

Surfaced during review of PR #4024 (through-source-type-source-scope-not-merged).
That fix converged the DIRECT-QUERY path: `AssociationScope#addConstraints`
(association-scope.ts) now folds a has_many/has_one :through SOURCE reflection's
own scope into the through query, including the `source_type:` polymorphic
belongsTo case.

The EAGER/PRELOAD path does NOT share this code. The preloader builds its scope
in `preloader/association.ts` (~line 349-354) by merging `reflection.scope` — the
THROUGH reflection's own (delegate) scope — and never folds in the SOURCE
reflection's `constraints()`. So `.includes(:tagged_posts)` / preload skips any
scope declared on the source reflection (whether `source_type:` or not), while
the direct `tag.tagged_posts` query applies it. Same asymmetry exists for the
non-source_type through source-scope case (PR #3866 also only touched
addConstraints).

Rails routes BOTH paths through the same constraint folding: the preloader's
`through_scope` / `reflection_scope` ultimately rely on `AssociationScope` /
`add_constraints` over the full chain (`association_scope.rb:124-156`), so the
source reflection's constraints apply in eager loading too.

## Acceptance criteria

- [ ] An eager/preload load (`.includes(...)` / `preload`) of a has_many/has_one
      :through whose SOURCE reflection carries a `-> { where(...) }` (or order)
      scope applies that predicate — matching the direct-query path and Rails.
- [ ] Covers BOTH the plain source and the `source_type:` polymorphic source
      (resolve the polymorphic klass via source_type, as the direct path does).
- [ ] Existing eager source_type tests (eager `taggedPosts`) still pass.
- [ ] Canonical test mirroring the direct-path test added in PR #4024
      (scoped polymorphic `taggable` source via `.includes`); no bespoke tables.
