---
title: "One build_arel on the live path: _buildArel vs the unreachable query-methods port"
status: draft
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing `relation-order-string-arg-stays-bare` (PR #4952).

`buildArel` in `packages/activerecord/src/relation/query-methods.ts:2660` is the
Rails-faithful `build_arel` port delivered by
`0022-relation-arel-ast-convergence/relation-arel-build-arel-convergence`
(PR #3186) — it applies joins, WHERE, HAVING, GROUP, ORDER, LIMIT/OFFSET,
DISTINCT, FROM, LOCK and annotations.

It is **not on the live query path**. The actual SELECT build is
`Relation#_buildArel` (`packages/activerecord/src/relation.ts:4987`), a separate
implementation; `_qm.buildArel` is reached only via a private delegating shim
(`relation.ts:7227`) that nothing calls. So the codebase carries two
independent arel builders that can (and did, for ORDER BY) drift apart.

This was found by instrumenting `buildOrder` (called only from
`query-methods.ts` `buildArel`) and observing it never fires for
`Customer.order("name ASC").toSql()`.

Related: the order-specific slice is tracked separately by
`converge-order-pipeline-onto-preprocess-order-args`; this story covers the
remaining `build_arel` surface (joins/select/from/lock/CTE/annotations).

## Acceptance criteria

- [ ] One `build_arel` implementation on the live path — either `_buildArel` is
      replaced by the `query-methods.ts` port, or the port is deleted and
      `_buildArel` is renamed/mapped as the real `build_arel` for `api:compare`.
- [ ] No dead private delegating shim left on `Relation` for `buildArel`.
- [ ] `api:compare` still maps `build_arel` to a real, reachable port (see
      the Rails-layout-file rule in CLAUDE.md).
- [ ] Full AR suite green; no change to emitted SQL.
