---
title: "arel: burn parity:api:moves' 66 include-chain relocations to zero"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: placement
packages: ["arel"]
deps: ["moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:moves` reports **66** arel methods "matched via include chain but living in the wrong
file". Every row is a module member Rails `include`s into several hosts, reported once per host:

- `factory-methods.ts` → `nodes/node.ts` (11): `createTrue`, `createFalse`, `createTableAlias`, `createJoin`, `createStringJoin`, `createAnd`, `createOn`, `grouping`, `lower`, `coalesce`, `cast`
- `factory-methods.ts` → `table.ts` (11): `createTrue`, `createFalse`, `createTableAlias`, `createJoin`, `createStringJoin`, `createAnd`, `createOn`, `grouping`, `lower`, `coalesce`, `cast`
- `factory-methods.ts` → `tree-manager.ts` (11): `createTrue`, `createFalse`, `createTableAlias`, `createJoin`, `createStringJoin`, `createAnd`, `createOn`, `grouping`, `lower`, `coalesce`, `cast`
- `expressions.ts` → `nodes/infix-operation.ts` (6): `count`, `sum`, `maximum`, `minimum`, `average`, `extract`
- `expressions.ts` → `nodes/node-expression.ts` (6): `count`, `sum`, `maximum`, `minimum`, `average`, `extract`
- `expressions.ts` → `nodes/sql-literal.ts` (6): `count`, `sum`, `maximum`, `minimum`, `average`, `extract`
- `order-predications.ts` → `nodes/infix-operation.ts` (2): `asc`, `desc`
- `order-predications.ts` → `nodes/node-expression.ts` (2): `asc`, `desc`
- `order-predications.ts` → `nodes/sql-literal.ts` (2): `asc`, `desc`
- `window-predications.ts` → `nodes/filter.ts` (1): `over`
- `alias-predication.ts` → `nodes/filter.ts` (1): `as`
- `window-predications.ts` → `nodes/function.ts` (1): `over`
- `filter-predications.ts` → `nodes/function.ts` (1): `filter`
- `alias-predication.ts` → `nodes/infix-operation.ts` (1): `as`
- `alias-predication.ts` → `nodes/node-expression.ts` (1): `as`
- `alias-predication.ts` → `nodes/over.ts` (1): `as`
- `alias-predication.ts` → `nodes/sql-literal.ts` (1): `as`
- `alias-predication.ts` → `table.ts` (1): `as`

The TS side already lives in the file mirroring the module (`factory-methods.ts`, `expressions.ts`,
`order-predications.ts`, `alias-predication.ts`, …), which is where Rails defines them — so this is
the measurement fault `moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced`
(RFC 0127) describes, not a port fault.

## Acceptance criteria

- [ ] After the RFC 0127 moves fix lands, `pnpm parity:api:moves` reports **0** arel rows; any row it still reports is relocated in this story.
- [ ] If `gate-the-wrong-file-moves-population` has landed, arel's moves mark is written at 0.

## Verification

```bash
pnpm parity:api:extra --package arel && pnpm parity:api:moves && pnpm parity:api:extra:gate && pnpm lint --fix
```
