---
title: "Join builders read private _leftOuterJoinsValues instead of public leftOuterJoinsValues accessor"
status: ready
updated: 2026-07-06
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4656's read-crediting converged the `joins_values` reads in the join
builders (`build_joins`, `build_join_buckets`, `build_join_dependencies` in
`packages/activerecord/src/relation/query-methods.ts`; `merge_joins` in
`relation/merger.ts`) because those bodies read the **public** `this.joinsValues`
accessor. Their `left_outer_joins_values` siblings did NOT converge: the same
bodies read the **private** `_leftOuterJoinsValues` field
(e.g. query-methods.ts buildJoins ~line 3040 `this._leftOuterJoinsValues.length`;
merger.ts mergeOuterJoins ~line 158 `this.other._leftOuterJoinsValues`), which
extractCalls credits as `_leftOuterJoinsValues`, not the public
`leftOuterJoinsValues` the Ruby `left_outer_joins_values` call maps to.

Rails (`relation/query_methods.rb`) reads the public `left_outer_joins_values`
value method. Converging trails to read `this.leftOuterJoinsValues` would drop
the residual `left_outer_joins_values` entries for build_joins,
build_join_buckets, build_join_dependencies, and merge_outer_joins from
`call-mismatches-wide-exclude.json`.

## Acceptance criteria

- Have the join builders read the public `leftOuterJoinsValues` accessor rather
  than the private `_leftOuterJoinsValues` field, matching Rails' value-method
  read (verify no behavioral change — the accessor exposes the same store).
- Remove the now-converged `left_outer_joins_values` baseline entries.
- `pnpm api:calls:wide` green; relation/join tests pass.
