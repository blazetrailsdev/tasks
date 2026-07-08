---
title: "converge-through-preload-collection-single-query-dedup"
status: draft
updated: 2026-07-08
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4783 converged the through-preload to Rails' single-query JOIN for a to-one,
non-through source. For a **collection** (has_many) or **nested** (through)
source/target the single-query JOIN can't be used (JOINing the source fans the
through rows out, and trails' row-collecting preloader lacks Rails' PK-deduping
eager `JoinDependency`), so those keep the two-step and only through-table-ONLY
predicates ride the through query.

That leaves one gap: a reflection-scope predicate that references BOTH the
through table and a source/other table in one node — e.g.
`where("posts.title = ? OR categorizations.author_id = ?")` on a has_many- or
nested-through. Neither single query in the two-step has both tables present, so
the predicate fails with `no such column` wherever it lands. This is a
pre-existing limitation (main's `_partitionReflectionWhere` copied such a
predicate onto the through query, equally invalid); no canonical model exercises
it.

Rails resolves it because `through_scope`
(`vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb:117-130`)
assigns the FULL `reflection_scope.where_clause` and then `includes!`/`references!`
the source reflection, so the through query is an eager-load with BOTH tables
joined; its `JoinDependency` instantiates the through parent deduplicated by PK,
neutralizing the fan-out.

## Acceptance criteria

- [ ] For a collection/nested through with a non-empty reflection where_clause,
      eager-load the source reflection onto the through query (copy the full
      where_clause + join the source, as the to-one path already does) so a
      cross-table predicate resolves against both tables in one query.
- [ ] Deduplicate the through (middle) records by primary key after loading, so
      the source join's fan-out does not multiply the final results — mirroring
      Rails' `JoinDependency` PK grouping. Cover `_getMiddleRecords`,
      `through_records_by_owner`, and `records_by_owner`.
- [ ] Once both tables are present in one query, the through-vs-source predicate
      classification (`predicateReferencesTable` / `predicateReferencesOtherTable`
      / `predicateIsThroughOnly` / `_throughScopeStrategy` / `_scopeHasFanOutJoin`)
      can be deleted — the single-query JOIN covers every source kind.
- [ ] No regression in the has_one/has_many/nested-through, eager-loading, and
      through-association-scope suites. Add a mixed cross-table predicate test on
      a has_many-through that currently fails with `no such column`.

## Notes

Depends on PR #4783 (this converges the to-one path and leaves the two-step
classification in place for the cases above). The PK-dedup is the crux and the
main risk — the through-record flow is shared with the polymorphic + sourceType
identity path, so dedup must preserve instance identity where those rely on it.
