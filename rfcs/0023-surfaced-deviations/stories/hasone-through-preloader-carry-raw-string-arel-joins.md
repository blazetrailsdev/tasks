---
title: "has_one-through preloader: nest reflection-scope raw string/Arel joins onto through query"
status: done
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 4526
claim: "2026-07-04T00:19:08Z"
assignee: "hasone-through-preloader-carry-raw-string-arel-joins"
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #4521 (story
`hasone-through-preloader-carry-nested-scope-joins-includes`). That PR converged
the has_one-through preloader's `_buildThroughScope` to nest the reflection
scope's `includes` / `joins` / `left_outer_joins` (and eager `order`) under the
source reflection onto the through query, mirroring Rails' `through_scope`
(`vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb:117-142`).

Gap deliberately left: the nested `joins!` only carries **symbol-association**
joins, sourced from `_namedInnerJoins`
(`packages/activerecord/src/associations/preloader/through-association.ts:438,476-484`).
Rails' `values[:joins]` is the scope's full `joins_values`, which may include
**raw SQL strings or Arel join nodes** — all nested via
`scope.joins!(source_reflection.name => joins)` (through_association.rb:132-134).
A reflection scope built with `.joins("INNER JOIN …")` on a has_one-through is
therefore not carried onto the through query; its predicate's table stays out of
the resolvable set and the predicate defers to the source-preloader stage. That
is failure-safe (no `no such column`, no wrong SQL) but is a missed carry vs
Rails. No current has_one-through model scope uses a raw join, so it is latent.

## Acceptance criteria

- [ ] `_buildThroughScope` (has_one branch) also nests the reflection scope's raw
      string / Arel joins (`_joinValues` / `_joinClauses`) under the source
      reflection where meaningful, or documents definitively why a raw join
      cannot be nested under an association-name hash in trails' join builder.
- [ ] Widen the resolvable-table set so a predicate qualifying a table reached by
      such a raw join rides the through query instead of deferring.
- [ ] A canonical-model has_one-through scope + test exercising a raw-join
      condition (mirror a Rails test if one exists), on SQLite/PostgreSQL/MariaDB.
- [ ] No regression in has_one_through / has_many_through / nested-through /
      preloader / eager suites.

## Notes

Relevant code: `packages/activerecord/src/associations/preloader/through-association.ts`
(`_buildThroughScope`, `_resolveNestedTableNames`).
Rails: `preloader/through_association.rb:117-142`; `relation.rb:1238-1242`.
