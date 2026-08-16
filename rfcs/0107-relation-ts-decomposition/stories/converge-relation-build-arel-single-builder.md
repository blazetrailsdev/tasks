---
title: "One Arel builder: retire _buildSelectManager for the build_arel port"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: ["retire-relation-private-thunk-block"]
deps-rfc: []
est-loc: 700
priority: null
pr: 6593
claim: "2026-08-16T12:18:38Z"
assignee: "converge-relation-build-arel-single-builder"
blocked-by: null
closed-reason: null
---

## Context

Rails builds a relation's Arel in one method: `build_arel`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1651`)
— joins, where, having, take/skip, group, `build_order`, `build_with`,
`build_select`, `optimizer_hints`, `distinct`, `from`, `lock`, annotate-dedup.

trails has **two** builders.

The faithful one is `packages/activerecord/src/relation/query-methods.ts:2625`
`buildArel()`. It is a near-line-for-line port of the Ruby and it is correct.
**Nothing calls it.** The only reference in the package is a duck-check,
`typeof resolved.buildArel === "function"`, at `relation/query-methods.ts:2449`.

The live one is a hand-rolled reimplementation in `relation.ts` with no Rails
counterpart:

- `relation.ts:5315` `_buildSelectManager()` — does `build_arel`'s job under an
  invented decomposition: `_applyJoinsToManager` (174 lines, `:3154`),
  `_applyWheresToManager` (`:5376`), `_applyOrderToManager` (`:5644`),
  `_buildProjections` (`:4699`), `_buildFromNode` (`:5460`), `_combineNodes`
  (`:5366`), `_collectAllWhereNodes` (`:5372`)
- `relation.ts:4954` `_buildArel()` — **shadows the Rails name** while calling
  `_buildSelectManager` + `_applyCtesAndAnnotationsToManager` (`:4966`)
- `relation.ts:7134` `buildArel()` — a thunk that _does_ delegate to
  `_qm.buildArel`, and is itself unreached

Live callers of the invented path: `toSql()` (`:4984`), `_toSql()` (`:5039`),
`toArel()` (`:4716`), `arel()` (`:6048`), `_cteBodyArelNode()` (`:5529`),
`execMainQuery` (`:6947`).

A bespoke compile layer hangs off it where Rails just calls
`connection.to_sql(arel)` (`relation.rb:1217-1218`): `_compileSelectSql`
(`:5465`), `_compileAstWithBinds` (`:5535`), `_typeCastBinds` (`:5546`),
`_applyBindLimitFallback` (`:5496`), `_arelVisitor` (`:5429`), `_selectVisitor`
(`:5438`), `_toSqlViaConnection` (`:5016`).

Note the two builders have _observably different_ semantics — `_qm.buildArel`
applies `sanitizeLimit` and `arelColumns` to the group values and calls
`buildWith`/`buildSelect`, while `_buildSelectManager` uses
`groupColumnToArel` and `_buildProjections` and folds CTEs separately. Diffing
them and reconciling onto the Rails shape is the substance of this story.

Cluster total: ~700 lines with no Rails counterpart.

This is likely more than one PR's worth of LOC. Ship the reconciliation of
`_buildSelectManager` onto `_qm.buildArel` first and file the compile-layer
half (`_compileSelectSql` and friends → `connection.toSql`) as its own story
under this RFC.

## Acceptance criteria

- `relation.ts` has exactly one Arel builder, reached under the Rails name
  `buildArel`, whose body is `relation/query-methods.ts:2625` — the port of
  `query_methods.rb:1651`.
- `_buildSelectManager`, `_buildArel`, `_applyCtesAndAnnotationsToManager` and
  their invented satellites (`_applyWheresToManager`, `_applyOrderToManager`,
  `_buildProjections`, `_buildFromNode`, `_combineNodes`,
  `_collectAllWhereNodes`) are deleted, not renamed.
- Any behavior `_buildSelectManager` carried that `_qm.buildArel` lacks is
  restored **in `_qm.buildArel` at the Rails call site**, or, if it is a real
  Rails behavior Rails puts elsewhere, in that Rails-named method — not in a
  new helper.
- SQL output is unchanged: `pnpm vitest run packages/activerecord/src/relation`
  plus `relation/arel-ast-convergence.test.ts`,
  `relation/build-joins-from-subquery-dedup.test.ts`, `relation/with.test.ts`
  pass unchanged.
- `pnpm parity:api:calls` / `:args` clean; `pnpm parity:api` and
  `pnpm parity:test` deltas non-negative.
