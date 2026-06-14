---
title: "Relation#arel/#toArel: converge on full build_arel (joins/HAVING/FROM/LOCK/CTEs), not projection-only"
status: done
updated: 2026-06-14
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: ["from-clause-arel-manager"]
deps-rfc: []
est-loc: 300
priority: 3
pr: 3186
claim: "2026-06-13T12:02:10Z"
assignee: "relation-arel-build-arel-convergence"
blocked-by: null
---

## Context

Rails' `Relation#arel` returns the **complete** query AST via `build_arel`
(`active_record/relation/query_methods.rb`): joins, WHERE, HAVING, GROUP,
ORDER, LIMIT/OFFSET, DISTINCT, FROM, LOCK, CTEs, comments/annotations — the
manager Rails then compiles is the single source of truth, and anything
downstream (merging, subquery embedding, `where(relation: …)`, calculations)
composes off it.

Our `Relation#toArel` (`packages/activerecord/src/relation.ts:3785`, aliased
as `arel()` at L4752) is a **partial** build: projections, wheres, order,
distinct, limit/offset, group — and stops. It does NOT apply joins, HAVING,
FROM (`_buildFromNode` exists but is only used by the `_toSql` path), LOCK, or
CTEs. The comment at L3781 acknowledges the legacy `toArel`/`toSql` split that
`buildSelect` is supposed to stay in sync with. Consequences:

- Anything that consumes `relation.arel()` as a subquery (Rails patterns like
  `where(id: subrelation.arel)` or RFC-0022's `from(relation)` →
  `opts.arel.as(name)`) silently drops joins/HAVING/CTEs from the subquery.
- Two parallel SQL-assembly paths must be kept in sync by hand — the standing
  source of the string-rewrite workarounds this RFC removes.

Work: port `build_arel` faithfully — extend `toArel` to apply the missing
clauses in Rails' order (read `build_arel` top to bottom and mirror the
sequence; join application goes through the JoinDependency the way
`build_joins` does), then converge `_toSql` to compile **this** manager
instead of its own assembly. The convergence may be too large for one PR; the
natural split is (a) complete `toArel` + assert SQL-equivalence against the
`_toSql` output across the ported relation tests, (b) flip `_toSql` to compile
the manager and delete the duplicated assembly. If (b) overflows, register a
continuation story via `pnpm tasks new` rather than fanning out.

Sequencing: depends on [[from-clause-arel-manager]] (FROM node exists);
coordinate with [[cte-relation-arel-value-branches]] (CTE value branches) and
land after the set-op AST work to avoid re-opening the same regions of
`relation.ts`.

## Acceptance criteria

- [ ] `toArel()` output includes joins, HAVING, FROM, LOCK, and CTEs whenever
      the relation carries them; verified by tests asserting
      `connection.toSql(rel.arel())` equals `rel.toSql()` for representative
      relations (joins+having+group, from-subquery, CTE, lock).
- [ ] Clause application order mirrors Rails `build_arel` (cite
      `query_methods.rb` line ranges in the PR).
- [ ] Either `_toSql` compiles the `toArel` manager (preferred), or the
      continuation story for that flip is registered.
- [ ] No test renames; `test:compare` and `api:compare` deltas ≥ 0; ≤500 LOC
      per PR.
