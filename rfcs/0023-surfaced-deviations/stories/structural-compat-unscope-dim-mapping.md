---
title: "structurally_incompatible: extend unscope-aware empty-array distinction to all dims"
status: done
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4178
claim: "2026-07-20T17:41:10Z"
assignee: "structural-compat-unscope-dim-mapping"
blocked-by: null
---

## Context

PR #4161 made `structurallyIncompatibleValuesFor`
(`packages/activerecord/src/relation/query-methods.ts`) distinguish a "never set"
empty multi-value (Rails `v2.nil?` → compatible) from an explicitly
`unscope(<dim>)`-emptied one (Rails keeps `[]` as an Array → compared →
incompatible) by checking `other._unscopeValues.includes(label)`.

That check uses the STRUCTURAL*FIELDS \_label* directly as the unscope dim name.
It is exact for dims whose label already matches the `unscope`/Rails value name
(order, select, group, includes, preload, eagerLoad, joins, distinct, lock,
limit, offset, from). It silently does NOT apply to STRUCTURAL_FIELDS whose label
differs from the unscope name — `joinValues`, `leftOuterJoinsValues`,
`namedInnerJoins`, `distinctOn`, `rawOrder`. For those, an explicit
`unscope(:joins)` / `unscope(:left_outer_joins)` etc. that empties the backing
array is still treated as "never set" → `and`/`or` would be considered
compatible where Rails raises `ArgumentError`.

This is a narrow, untested edge (combining an explicitly-unscoped relation on one
of those specific dims via `and`/`or`), but it is a known fidelity gap left by the
PR's pragmatic fix.

## Acceptance criteria

- [ ] Map every STRUCTURAL_FIELDS label to the unscope/Rails value name that
      empties its backing array (or otherwise track per-dim "explicitly set"
      state), so the empty-vs-unscoped distinction holds for joins/leftOuterJoins/
      distinctOn/rawOrder etc., not only the name-matching dims.
- [ ] Add a structural-compat test: `X.and(Y.unscope(:joins))` (and the other
      previously-uncovered dims) is incompatible, while `X.and(never_joined)`
      stays compatible.
- [ ] No regression in and/or/structural-compatibility tests.
