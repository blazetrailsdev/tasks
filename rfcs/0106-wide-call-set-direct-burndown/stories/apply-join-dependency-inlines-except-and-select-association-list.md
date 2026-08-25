---
title: "apply_join_dependency inlines except(...).joins! and select_association_list"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: 6573
claim: "2026-08-15T18:15:06Z"
assignee: "apply-join-dependency-inlines-except-and-select-association-list"
blocked-by: null
closed-reason: null
---

# `apply_join_dependency` inlines `except(...).joins!` and `select_association_list`; trails extracts both

## Context

`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:457-485`:

```ruby
join_dependency = construct_join_dependency(
  eager_load_values | includes_values, Arel::Nodes::OuterJoin
)
relation = except(:includes, :eager_load, :preload).joins!(join_dependency)

if eager_loading && has_limit_or_offset? && !(
    using_limitable_reflections?(join_dependency.reflections) &&
    using_limitable_reflections?(
      construct_join_dependency(
        select_association_list(joins_values).concat(
          select_association_list(left_outer_joins_values)
        ), nil
      ).reflections
    )
  )
```

`packages/activerecord/src/relation.ts` spells both inlined expressions as
trails-only privates Rails does not have:

- `_exceptEagerValues(jd)` for `except(:includes, :eager_load, :preload)
.joins!(join_dependency)` — three call sites (`applyJoinDependency`,
  `_applyJoinDependencyAsync`, `_applyEagerJoinDependency`);
- `_joinsReflectionsAreLimitable()` for the second `using_limitable_reflections?`
  clause. It reads `_namedInnerJoins`/`_leftOuterJoinsValues` — the lists trails
  routes association joins into at `joins()` time — instead of calling
  `selectAssociationList` (which exists, `relation.ts` → `query-methods.ts`) on
  `joins_values`/`left_outer_joins_values`.

Two `kind: "set"` rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
(`apply_join_dependency`/`except`, `apply_join_dependency`/`select_association_list`)
carry verified per-site reasons for this from PR #6566. CLAUDE.md is explicit
that a Rails-inlined expression stays inlined and that an extraction Rails does
not have is measured surface.

## Converged shape

Inline the `except(...).joins!(join_dependency)` expression at each of the three
call sites and delete `_exceptEagerValues`; drive the second limitability clause
through `selectAssociationList(joinsValues)` /
`selectAssociationList(leftOuterJoinsValues)` fed into
`constructJoinDependency(..., null)`, matching finder_methods.rb:466-470, and
delete `_joinsReflectionsAreLimitable`. Watch the shared AliasTracker / `walk`
dedup that `_withEagerJoinDependency` currently sets up — it is why the
extraction exists, and any convergence has to keep the single
`join_constraints` fold.

## Acceptance criteria

- [ ] `applyJoinDependency` reads as finder_methods.rb:457-485 line for line.
- [ ] `_exceptEagerValues` and `_joinsReflectionsAreLimitable` are gone.
- [ ] The two `relation.json` rows above are deleted by hand via
      `serializeBaseline`, then `pnpm parity:api:calls:tighten
activerecord/relation.json`. No reseed.
- [ ] `pnpm parity:api:extra --package activerecord` does not grow; SQLite, PG,
      MySQL/MariaDB green.
