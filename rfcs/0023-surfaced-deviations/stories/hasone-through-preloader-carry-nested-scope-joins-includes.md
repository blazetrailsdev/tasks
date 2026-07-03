---
title: "has_one-through preloader: carry reflection-scope nested joins/includes onto the through query"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #4508 (story
`hasone-through-source-condition-preload-selects-wrong-through-row`). That PR
converged the has_one-through preloader so a source-table (or unqualified, or
mixed through/source) scope condition constrains which through row the has_one
selects: `through-association.ts` `_buildThroughScope` now LEFT-OUTER-joins the
**immediate** source reflection onto the through query and copies every
reflection-scope predicate that references no table beyond the through/source
pair.

What it deliberately did NOT do: mirror Rails' fuller `through_scope`
carry-over. Rails copies the whole `reflection_scope.where_clause` AND then
propagates the scope's `includes` / `references` / `joins` / `left_outer_joins`
and (when eager-loading) `order` values through the source reflection —
`vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb:117-142`.
trails only adds the single immediate-source join, so a has_one-through scope
whose predicate qualifies a **deeper (nested) table** reached via the scope's
own `.joins`/`.includes` is excluded from the through query (via
`predicateReferencesForeignTable`) and left to the source-preloader stage. That
avoids a `no such column: <nested>.<col>` error, but means such a nested
condition does not constrain which through row wins — the same ordering-dependent
deviation class the parent story fixed, just one level deeper.

No current has_one-through model scope exercises this (the canonical scopes —
`favoriteClub`, `hairyClub` — reference only the through/source tables), so it
is latent, not a live test failure. This story tracks converging the through
query to carry the reflection scope's nested joins/includes/references/order so
deeper conditions are honored on the through query the way Rails does.

## Acceptance criteria

- [ ] In `through-association.ts` `_buildThroughScope` (has_one branch), when the
      reflection scope carries `includes` / `references` / `joins` /
      `left_outer_joins` (and eager-loading `order`) values, propagate them
      through the source reflection onto the through query, mirroring
      `through_association.rb:117-142`.
- [ ] A has_one-through scope with a predicate on a nested table reached via the
      scope's own join then constrains which through row the has_one selects
      (not deferred to the source-preloader stage), with no `no such column`
      error, on SQLite/PostgreSQL/MariaDB.
- [ ] No regression in has_one_through / has_many_through / nested-through /
      preloader / eager suites on any adapter.
- [ ] Add a canonical-model has_one-through scope + test that exercises a
      nested-table condition (mirroring a Rails test if one exists) so the path
      is covered rather than latent.

## Notes

Relevant code: `packages/activerecord/src/associations/preloader/through-association.ts`
(`_buildThroughScope`, `predicateReferencesForeignTable`).
Rails: `vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb:105-143`.
