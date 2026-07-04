---
title: "has_one-through preloader: resolve multi-level nested joined tables for through-query predicate carry"
status: ready
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 9000000
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #4521 (story
`hasone-through-preloader-carry-nested-scope-joins-includes`). The
has_one-through preloader now widens the through query's resolvable-table set
with the tables a reflection scope's `includes`/`joins`/`left_outer_joins` reach,
via `_resolveNestedTableNames`
(`packages/activerecord/src/associations/preloader/through-association.ts`).

Gap deliberately left: `_resolveNestedTableNames` resolves associations
**single-level** against the source reflection's klass — a nested hash spec
(e.g. `.joins({ category: :subcategory })` / `.includes({ x: :y })`) collects
only the first-level key, so a predicate qualifying a **two-or-more-levels-deep**
table (e.g. `subcategories.col`) is not added to the resolvable set and defers to
the source-preloader stage. Rails nests the whole spec under
`source_reflection.name => …` so the deeper join is realized on the through query
(through_association.rb:120-142). trails' behavior is failure-safe (no
`no such column`) but does not constrain the through row for a deeper condition.
No current has_one-through model scope reaches two levels, so it is latent.

## Acceptance criteria

- [ ] `_resolveNestedTableNames` walks nested hash/array specs recursively,
      resolving each level against the correct klass (source klass, then each
      nested association's klass) so multi-level joined tables enter the
      resolvable set.
- [ ] A has_one-through scope with a predicate on a 2+-level-deep table then
      constrains the through row on the through query (no `no such column`), on
      SQLite/PostgreSQL/MariaDB.
- [ ] A canonical-model has_one-through scope + test exercising a 2-level nested
      condition (mirror a Rails test if one exists).
- [ ] No regression in has_one_through / has_many_through / nested-through /
      preloader / eager suites.

## Notes

Relevant code: `packages/activerecord/src/associations/preloader/through-association.ts`
(`_resolveNestedTableNames`, `_buildThroughScope`).
Rails: `preloader/through_association.rb:120-142`.
