---
title: "converge-has-many-delete-records-rich-reflection"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6425
claim: "2026-08-12T16:36:52Z"
assignee: "pg-cancel-block-half-has-no-regression"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the `delete_records order:scope,klass` row in
PR #6395 (RFC 0084). The call ORDER is converged and the invented
`scopeForRecords` helper is gone, but `HasManyAssociation#deleteRecords`
(`packages/activerecord/src/associations/has-many-association.ts:236-276`) still
diverges from
`vendor/rails/activerecord/lib/active_record/associations/has_many_association.rb:127-137`
in two places, both rooted in `this.reflection` being the thin
`AssociationDefinition` rather than a rich reflection:

1. Rails: `query_constraints = reflection.klass.composite_query_constraints_list`
   (`:132`). The port calls it on `this.klass` because `AssociationDefinition`
   has no `klass` — `tsc` rejects `this.reflection.klass`. Same class in
   practice, but the receiver is not Rails'.
2. Rails: `update_counter(-records.length) unless reflection.inverse_updates_counter_cache?`
   (`:130`). The port re-resolves a rich reflection through
   `owner.constructor._reflectOnAssociation(this.reflection.name)` and then
   calls `inverseWhichUpdatesCounterCache()` off it, falling back to
   `this.reflection` — because the thin definition carries neither predicate.
   `AbstractReflection#isInverseUpdatesCounterCache` already exists
   (`reflection.ts:482-484`, Rails' `alias inverse_updates_counter_cache?
inverse_which_updates_counter_cache`, `reflection.rb:297`); the arm should
   read `this.reflection.isInverseUpdatesCounterCache()` directly.

The same `owner.constructor._reflectOnAssociation(...) ?? this.reflection`
re-resolve appears in `countRecords` (`:283-289`) and in
`collection-proxy.ts:2382-2385`, so this is a cluster, not a one-off.

The converged shape is: `this.reflection` on a `HasManyAssociation` resolves to
the rich `AssociationReflection` (as Rails' `Association#reflection` does,
`association.rb:16`), the two re-resolves are deleted, and both bodies read
`reflection.klass` / `reflection.isInverseUpdatesCounterCache()` directly.

Also still un-Rails in that file, for the same body: `deleteCount` and
`updateCounter` are module-level functions taking the association as their
first argument where Rails has `delete_count(method, scope)` and
`update_counter(difference, reflection = reflection())` as private instance
methods (`has_many_association.rb:96-100,139-149`).

## Acceptance criteria

- [ ] `deleteRecords` reads `reflection.klass` and
      `reflection.isInverseUpdatesCounterCache()` with no
      `_reflectOnAssociation` re-resolve.
- [ ] The same re-resolve is removed from `countRecords` and
      `collection-proxy.ts`, or the residue is filed with the reason it cannot
      go.
- [ ] `deleteCount` / `updateCounter` become instance methods with Rails'
      parameter lists, or the divergence is cited at the call site.
- [ ] AR association suites pass on all three adapter lanes; no new
      `call-mismatches-exclude` row.
