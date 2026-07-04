---
title: "Set-ops: compose eager-load operands as a JoinDependency-instantiated UNION (replace preload fallback)"
status: closed
updated: 2026-07-04
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: []
deps-rfc: []
est-loc: 350
priority: 20
pr: 3398
claim: null
assignee: null
blocked-by: null
closed-reason: "abandoned: non-Rails union/intersect/except surface; PR #3398 closed unmerged; superseded by relation-remove-non-rails-set-operation-methods"
---

## Context

Surfaced while finishing `set-operations-cte-eager-ast` (PR #3187). That story's
acceptance criterion #1 wanted eager-load operands to "compose a single
`Nodes.Union*` AST" alongside CTE/annotate. CTE and annotate compose cleanly, but
**eager-load does not** and was deliberately left as a plain-projection + preload
fallback, because composing the JoinDependency manager into a UNION operand is
not viable as-is:

- The JD manager emits the wide `t0_r*` aliased column list + `LEFT OUTER JOIN`s.
  That makes the operand **arity-incompatible** with the other UNION side (every
  DB rejects differing column counts between compound SELECTs).
- Even with matching projections, the compound executes through the
  `_eagerLoadBypassesJoinDependency` branch and instantiates rows as **plain
  models**, so the `t0_r*` aliases would not be JoinDependency-instantiated.

Current behaviour (shipped in #3187): `_buildSetOperationOperandManager` always
builds the plain `_buildSelectManager()` projection, and both operands' eager
specs are merged into the compound's preload set
(`relation.ts` `toArray` set-op preload branch). So associations load via
**preload** (separate queries), not an eager JOIN. Rails has no `Relation#union`,
so there is no canonical JD-through-union path to mirror — this is a trails
enhancement, not a Rails-parity gap.

This story tracks making eager set-op operands compose a real
JoinDependency-instantiated UNION: give both operands matching JD column aliases
(union requires identical projection shape) and JD-instantiate the unioned rows,
replacing the preload fallback. Non-trivial — both the projection-alignment and
the instantiation path need design first.

## Acceptance criteria

- [ ] An eager-load set-op operand composes its JoinDependency projection into the
      `Union*` AST with both sides arity-compatible (identical aliased column list).
- [ ] The compound's rows are JoinDependency-instantiated (associations populated
      from the JOINed columns), not preloaded via separate queries.
- [ ] SQLite / PG / MySQL output + results correct; the `set-operations-cte-eager-ast`
      preload fallback tests still pass or are superseded with equivalent coverage.
