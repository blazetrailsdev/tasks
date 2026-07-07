---
title: "Collapse nested-through preload query count via source eager-load on the through query (4→2, drop table-name string matching)"
status: ready
updated: 2026-07-07
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps:
  - converge-through-preload-single-query-join
deps-rfc: []
est-loc: 200
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #4692 (nested-through-preloader-recursive-scope-structuring),
which converged `Preloader::ThroughAssociation` to Rails' recursive
per-reflection scope structuring but deliberately kept trails' per-stage query
count.

trails' nested-through preload issues **one query per chain stage** — for
`Author.includes(:misc_post_first_blue_tags_2)` that is
authors + posts + taggings + tags = **4 queries**. Rails issues **2**
(`nested_through_associations_test.rb:562`,
`test_nested_has_many_through_with_conditions_on_source_associations_preload`
asserts `assert_queries_count(2)` around `.third`).

The gap is architectural: Rails' `through_scope`
(`preloader/through_association.rb:117-146`) copies the reflection scope's
where_clause onto the through query AND `includes!(source_reflection.name)` /
`references!(source_reflection.table_name)`, so the outer through query
eager-loads the source sub-chain via a real JOIN and the recursive
`source_preloaders` finds the middle records already carrying their source
association — collapsing the deeper stages into the single through query.

trails' `_buildThroughScope`
(`packages/activerecord/src/associations/preloader/through-association.ts`)
approximates that copy by table-name string matching (`predicateReferencesTable`
/ `predicateReferencesForeignTable`) rather than issuing actual Arel joins, and
`_getSourcePreloaders` spawns a fully independent per-stage preload. So each
stage is a separate query and the through query does not eager-load its source.

The pinned count in `nested-through-associations.test.ts`
("nested has many through with conditions on source associations preload")
asserts 4 with an inline rationale rather than Rails' 2.

Two observable consequences the current design leaves in place:

1. Query-count divergence (4 vs 2) on scoped nested-through preloads.
2. Latent gap (noted in #4692/#4663): an _outer_ reflection predicate that
   qualifies a _source sub-chain intermediate_ table cannot resolve at any
   single trails stage (the intermediate table is not in that stage's FROM) —
   Rails resolves it because the through query joins the sub-chain. No canonical
   model hits this today, but a real join-based `through_scope` would close it.

## Acceptance criteria

- Make `_buildThroughScope` eager-load the source reflection onto the through
  query (Rails' `includes!(source_reflection.name)` +
  `references!(source_reflection.table_name)`), so a scoped nested-through
  preload collapses the source sub-chain into the through query instead of a
  separate per-stage preload.
- Reduce the pinned query count in
  `nested-through-associations.test.ts` ("nested has many through with
  conditions on source associations preload") toward Rails' assertion
  (`assert_queries_count(2)`), updating/removing the inline "4 stages"
  rationale once the structure collapses.
- Replace the table-name-string approximation
  (`predicateReferencesTable` / `predicateReferencesForeignTable`) in
  `_buildThroughScope` with actual join-aware resolution where the eager-load
  makes the intermediate tables available — or scope this to the query-count
  collapse and register the string-matching removal separately if it does not
  fit in one PR.
- Keep the three source-association tests and the broader through/preloader
  suites green.
