---
title: "converge-promoted-includes-into-eager-loading"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6648
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-relation-select-and-join-residue`, which converged the
other two members of the select/join residue (`_isKnownColumn` →
`arel_column`, `joinDependencyFallback` → the inlined
`lookup_table_klass_from_join_dependencies` block) but could not converge
`_promotedIncludes` inside one PR.

`Relation#_promotedIncludes` (`packages/activerecord/src/relation.ts`, read by
`exec_queries` and `exec_main_query`) returns the _list_ of includes this
relation promotes to an eager JOIN, together with its two feeders
`_includesToPromoteFromReferences` and `_includesToPromoteFromJoins`. Rails has
no per-association promotion at all: `eager_loading?` (relation.rb:1481-1487)
is a single memoized boolean —

```ruby
@should_eager_load ||=
  eager_load_values.any? ||
  includes_values.any? && (joined_includes_values.any? || references_eager_loaded_tables?)
```

— and every consumer (`exec_main_query` relation.rb:1428, `preload_associations`
relation.rb:1322) reads that boolean, promoting _all_ `includes_values` or none.

Converging means flipping trails' per-association promotion to Rails'
all-or-nothing boolean, which reaches into `_executeEagerLoad` and the eager
preload subtraction in `exec_queries` — i.e. squarely inside the surface
`converge-apply-join-dependency-eager-cluster` owns. Do this alongside or after
that story.

## Acceptance criteria

- `_promotedIncludes`, `_includesToPromoteFromReferences` and
  `_includesToPromoteFromJoins` are retired.
- `eager_loading?` exists as the memoized boolean of relation.rb:1481-1487,
  with `joined_includes_values` (relation.rb:1489-1491) and
  `references_eager_loaded_tables?` (relation.rb:1474) as its feeders.
- `exec_main_query` and `preload_associations` read that boolean, as Rails does.
- No behaviour change beyond Rails' all-or-nothing promotion; the `relation/`
  and `associations/` suites pass.
