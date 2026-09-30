---
title: "arel: remove or credit the 34 invented branches in arel bodies (report-arms invented rows)"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: arms
packages: ["arel"]
deps: ["arel-converge-missing-control-flow-arms"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=arel --direction=invented` lists **34** arel pairs whose TS
body adds a branch Rails does not have. RFC 0113 measured `if` at ~70% non-real at repo scale (type
narrowing, `?.`, argument normalisation the extractor reads as a branch), so each row is either a real
invented guard to delete or an extractor false positive to fix in `scripts/api-compare/`:

- `packages/arel/src/collectors/sql-string.ts#addBinds` — `+loop`
- `packages/arel/src/collectors/substitute-binds.ts#addBind` — `+if`
- `packages/arel/src/insert-manager.ts#insert` — `+if +if +if`
- `packages/arel/src/nodes/bind-param.ts#isInfinite` — `+if +if +if`
- `packages/arel/src/nodes/bind-param.ts#isUnboundable` — `+if`
- `packages/arel/src/nodes/case.ts#else` — `+if`
- `packages/arel/src/nodes/casted.ts#isInfinite` — `+if +if +if`
- `packages/arel/src/nodes/function.ts#constructor` — `+if`
- `packages/arel/src/nodes/homogeneous-in.ts#right` — `+if`
- `packages/arel/src/nodes/homogeneous-in.ts#castedValues` — `+if +if`
- `packages/arel/src/nodes/matches.ts#constructor` — `+if`
- `packages/arel/src/nodes/node.ts#toSql` — `+if +throw`
- `packages/arel/src/nodes/sql-literal.ts#constructor` — `+if`
- `packages/arel/src/nodes/table-alias.ts#isAbleToTypeCast` — `+if`
- `packages/arel/src/select-manager.ts#join` — `+if`
- `packages/arel/src/select-manager.ts#union` — `+if`
- `packages/arel/src/table.ts#join` — `+if`
- `packages/arel/src/update-manager.ts#set` — `+if`
- `packages/arel/src/update-manager.ts#having` — `+if`
- `packages/arel/src/visitors/dot.ts#accept` — `+if +if`
- `packages/arel/src/visitors/dot.ts#visitString` — `+if +if +if`
- `packages/arel/src/visitors/dot.ts#visitEdge` — `+if +throw`
- `packages/arel/src/visitors/dot.ts#visit` — `+if +if +if +if +if +if +if +if +if +if +if`
- `packages/arel/src/visitors/dot.ts#edge` — `+try`
- `packages/arel/src/visitors/dot.ts#withNode` — `+try`
- `packages/arel/src/visitors/to-sql.ts#visitArelNodesDeleteStatement` — `+if`
- `packages/arel/src/visitors/to-sql.ts#visitArelNodesInsertStatement` — `-loop +if +if`
- `packages/arel/src/visitors/to-sql.ts#visitArelNodesCasted` — `+if +if`
- `packages/arel/src/visitors/to-sql.ts#visitArelNodesBetween` — `+if`
- `packages/arel/src/visitors/to-sql.ts#visitArelNodesIn` — `+if +if`
- `packages/arel/src/visitors/to-sql.ts#visitArelNodesNotIn` — `+if`
- `packages/arel/src/visitors/to-sql.ts#visitArelNodesSqlLiteral` — `+if`
- `packages/arel/src/visitors/to-sql.ts#visitArelNodesBoundSqlLiteral` — `-if -if -if -if -if +loop`
- `packages/arel/src/visitors/visitor.ts#dispatchCache` — `+if +if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in the skeleton extractor (`scripts/api-compare/report-arms.ts` / `call-args.ts`) with a unit test, not by editing the port.
- [ ] `pnpm parity:api:arms:report --package=arel` reports **0** arel rows in either direction.
