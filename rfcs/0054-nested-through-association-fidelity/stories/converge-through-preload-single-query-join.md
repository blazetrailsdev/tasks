---
title: "converge-through-preload-single-query-join"
status: ready
updated: 2026-07-07
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

trails' through-association preloader deviates from Rails: it runs a **two-step
preload** (through query, then source query) and must attribute each
reflection-scope `where` predicate to one of the two queries by table. That
attribution is what forces the text/Arel table-scan in
`packages/activerecord/src/associations/preloader/through-association.ts`
(`_partitionReflectionWhere`, `predicateReferencesTable`, `rawSqlReferencesTable`,
`predicateReferencesForeignTable`, and the `stripSqlStringLiterals` heuristic
added by PR #4700).

Rails does none of this. `Preloader::ThroughAssociation#through_scope`
(`vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb`,
~lines 108-145) copies the **entire** `reflection_scope.where_clause` onto the
through query and `joins!(source_reflection.name => …)` (plus
`includes!`/`references!`/nested joins/left_outer_joins and order when
`eager_loading?`). Because the source reflection is JOINed onto the through
query, every column — through-table, source-table, or a scope-joined nested
table — resolves in ONE query. No per-predicate table attribution, no raw-SQL
text scan, is needed.

PR #4700 hardened the trails text-scan (string-literal false positives) but the
review and the parent story explicitly framed it as papering over the
deviation. This story is acceptance-criteria **option (b)** from
`preloader-through-rawsql-condition-text-attribution`: converge the
through-preload to Rails' single-query JOIN strategy so the whole text-attribution
apparatus can be deleted.

## Acceptance criteria

- [ ] `_buildThroughScope` copies the full reflection `where_clause` onto the
      through query and JOINs the source reflection (mirroring Rails
      `through_scope`), rather than partitioning predicates by referenced table.
- [ ] Delete the now-unneeded table-attribution helpers once the JOIN strategy
      resolves all columns in one query: `_partitionReflectionWhere`,
      `predicateReferencesTable`, `rawSqlReferencesTable`,
      `predicateReferencesForeignTable`, `rawSqlReferencesForeignTable`,
      `stripSqlStringLiterals`, and the associated `_resolveNestedTableNames`
      widening if it becomes moot.
- [ ] Preserve the eager_loading? carry-overs Rails' through_scope applies:
      nested joins/left_outer_joins/includes under the source reflection name,
      order, annotate, source_type filter, cascade_strict_loading.
- [ ] No regression in the four `a1-eager-sti-through` `favoriteClub` tests,
      `through-association-scope.test.ts`, `has-one-through-associations.test.ts`,
      `has-many-through-associations.test.ts`, `nested-through-associations.test.ts`,
      and the eager-loading suites.
- [ ] Verify the two-step source-preloader stage is still correct for the cases
      the single-query JOIN cannot cover (polymorphic source_type, disableJoins),
      which Rails also special-cases.

## Notes

Larger than the 500-LOC ceiling is likely; if so, split into non-overlapping
PRs from main (through_scope JOIN build first, helper deletion second) rather
than stacking. This supersedes the heuristic hardened by PR #4700.
