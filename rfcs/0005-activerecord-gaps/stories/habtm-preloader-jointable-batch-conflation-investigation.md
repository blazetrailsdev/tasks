---
title: "habtm-preloader-jointable-batch-conflation-investigation"
status: claimed
updated: 2026-07-03
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-03T13:09:57Z"
assignee: "habtm-preloader-jointable-batch-conflation-investigation"
blocked-by: null
closed-reason: null
---

## Context

PR #4468 (`habtm-sourcename-classname-convergence`) converged the HABTM
join-model source `belongsTo` naming to Rails: each `class_name`-aliased HABTM
(e.g. Category's `posts`/`other_posts`/`special_posts`, all `class_name: "Post"`
on `categories_posts`) gets its own anonymous join model whose source belongsTo
is named `singularize(assocName)` (`post`/`otherPost`/`specialPost`), matching
`vendor/rails/.../builder/has_and_belongs_to_many.rb:39-40` (`add_right_association`).

That exposed a preloader conflation: trails' `LoaderQuery`
(`packages/activerecord/src/associations/preloader/association.ts`) batches
preloads by the same four fields Rails uses
(`vendor/rails/.../preloader/association.rb:17-26`): `association_key_name`,
`scope.table_name`, `connection_specification_name`, `values_for_queries`. For
the three middle loaders these are **provably identical** (dumped
`valuesForQueries` byte-for-byte equal; same `category_id` key; same
`categories_posts` table). So they batch into one query and every row is
instantiated as whichever join model wins the group (`HABTM_Posts`). The through
source preloader (`ThroughAssociation._getSourcePreloaders`) then preloads
`otherPost` on `HABTM_Posts` records — which don't declare it — raising
`AssociationNotFound`.

PR #4468 added a narrow, trails-local guard: `LoaderQuery._joinModelDiscriminator`
appends the anonymous `HABTM_*` class name to the batch key so distinct
same-table join models don't merge. Rails has **no** such class discriminator,
yet `test_eager_with_multiple_associations_with_same_table_has_many_and_habtm`
(`vendor/rails/activerecord/test/cases/associations/eager_test.rb:1028`) passes.
The Rails-side reason its batched-record instantiation avoids the same conflation
was NOT pinned down from static reading (traced `Batch#call` ->
`group_and_load_similar` -> `LoaderQuery` -> `load_records_in_batch` ->
`LoaderRecords#records`; all point to a single-class materialization that
_should_ also conflate).

## Acceptance criteria

- [ ] Run Rails' `test_eager_with_multiple_associations_with_same_table_has_many_and_habtm`
      under a debugger / with logging to observe whether the three HABTM middle
      loaders actually batch together in Rails, and if so how the source
      preloader resolves the source belongsTo on the batched record class.
- [ ] Determine whether trails' `_joinModelDiscriminator` guard is (a) a faithful
      stand-in for a Rails mechanism, or (b) covering a deeper trails preloader
      divergence (e.g. batched-record instantiation, `_getMiddleRecords`, or the
      `record.association(name)` raise-vs-skip behavior in
      `Branch.groupedRecords`).
- [ ] Either document the guard as Rails-parity-justified (with the pinned Rails
      mechanism), or replace it with the correct convergent fix and drop the
      `HABTM_*` name-sniffing.
