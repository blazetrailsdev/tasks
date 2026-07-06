---
title: "apply_join_dependency: AND using_limitable_reflections? over joins/left_outer_joins reflections (not just eager JD)"
status: closed
updated: 2026-07-06
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by RFC 0022 done story using-limitable-reflections-joins-leftjoins-convergence (PR #4073), which converged using_limitable_reflections? onto both eager JD reflections and joins/left_outer_joins values; _eagerReflectionsAreLimitable no longer exists."
---

## Context

`Relation#_eagerReflectionsAreLimitable(specs)` (relation.ts) mirrors Rails
`using_limitable_reflections?` (finder_methods.rb:487) but only inspects the
**eager** JoinDependency reflections (the `includes`/`eager_load` specs). Rails'
`apply_join_dependency` (finder_methods.rb:463-471) gates the
`distinct_relation_for_primary_key` materialization on `using_limitable_reflections?`
applied to BOTH the eager JD reflections AND the reflections constructed from
`select_association_list(joins_values) | select_association_list(left_outer_joins_values)`:

```ruby
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

Consequence: a relation that adds an explicit `joins`/`left_outer_joins` to a
**collection** association alongside a _limitable_ `includes`, under
limit/offset, would skip PK materialization in trails but trigger it in Rails —
diverging SQL shape and potentially wrong results under fan-out.

This is a pre-existing approximation, now relied on at TWO call sites:

- `_executeEagerLoad` (toArray path), relation.ts ~4159
- `Relation#pluck`'s apply-join-dependency branch (added in PR #3371), relation.ts ~3294

Surfaced during review of PR #3371 (pluck-includes-limit-offset-distinct-pk).

## Acceptance criteria

- `_eagerReflectionsAreLimitable` (or its callers) also accounts for the
  reflections from `joins_values | left_outer_joins_values`, matching Rails'
  conjunction in `apply_join_dependency`.
- Both call sites (`_executeEagerLoad` and `pluck`) share the converged check.
- A test mirroring the Rails behavior: an `includes` (limitable) + explicit
  `joins`/`left_outer_joins` to a collection, under limit/offset, materializes
  the limited PKs (matching Rails). Use a Rails-verbatim test name if one exists.
- No regression to the existing includes/pluck/ids limit/offset tests.
