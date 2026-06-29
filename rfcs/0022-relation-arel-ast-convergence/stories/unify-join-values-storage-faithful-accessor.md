---
title: "Unify joins_values storage so the writer round-trips and builders use the accessor"
status: ready
updated: 2026-06-29
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`relation-value-accessor-rails-semantics` (PR #4293) added a `joins_values=`
writer, but trails splits Rails' single `@values[:joins]` array into two fields:
`_namedInnerJoins` (resolved through JoinDependency) and `_joinValues` (raw
string/Arel). Consequences of the split that remain as deviations:

1. The `joins_values=` writer (relation.ts, `set joinsValues`) cannot preserve
   insertion order — on round-trip, named joins always precede raw joins because
   the reader concatenates `[...this._namedInnerJoins, ...this._joinValues]`.
   Rails preserves the exact `|=` insertion order in one array.
2. The join-building paths read the split fields directly rather than through the
   `joinsValues` accessor, because the concatenated accessor erases the
   named-vs-raw distinction they need. This required baselining 10 wide
   call-mismatch entries (`joins_values`) in
   `scripts/api-compare/call-mismatches-wide-exclude.json`
   (`build_joins`, `build_join_dependencies`, `build_join_buckets`,
   `apply_join_dependency`, `merge_joins`, `associated`).

Rails source: `relation/query_methods.rb:868-876` (`joins`/`joins!` →
`self.joins_values |= args`), `:162-181` (generated `joins_values` accessor =
`@values.fetch(:joins, FROZEN_EMPTY_ARRAY)` / `@values[:joins] = value`).

## Acceptance criteria

- Unify join storage into a single insertion-ordered `joins_values` backing
  store (keeping any derived JoinDependency caches secondary/computed) so the
  `joins_values=` writer round-trips faithfully — no named-before-raw reorder.
- Convert the join builders to read the unified `joins_values` accessor, then
  remove the 10 `joins_values` entries from `call-mismatches-wide-exclude.json`.
- relation.rb / relation/query_methods.rb stay at 100% api:compare; no
  test:compare regression.
