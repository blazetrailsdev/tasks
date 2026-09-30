---
title: "arel: burn the 21 moved extras declared on nodes/ files"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: placement
packages: ["arel"]
deps: ["override-of-inherited-rails-member-scores-moved"]
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

`pnpm parity:api:extra --package arel` scores arel at **novel 0, moved 35, total 35** against the gated
mark in `scripts/api-compare/extra-surface-mark.json` (`arel.total = 35`). A _moved_ extra is a name
Rails defines, but in a different `.rb` than the TS file declaring it. These are the ones on node files:

- `packages/arel/src/nodes/binary.ts` — `and`, `not`, `or`
- `packages/arel/src/nodes/ascending.ts` — `nullsFirst`, `nullsLast`
- `packages/arel/src/nodes/descending.ts` — `nullsFirst`, `nullsLast`
- `packages/arel/src/nodes/infix-operation.ts` — `left`, `right`
- `packages/arel/src/nodes/join-source.ts` — `left`, `right`
- `packages/arel/src/nodes/sql-literal.ts` — `toString`, `value`
- `packages/arel/src/nodes/table-alias.ts` — `constructor`, `get`
- `packages/arel/src/attributes/attribute.ts` — `eql`
- `packages/arel/src/nodes/grouping.ts` — `constructor`
- `packages/arel/src/nodes/unary-operation.ts` — `expr`
- `packages/arel/src/nodes/values-list.ts` — `constructor`
- `packages/arel/src/nodes/window.ts` — `expr`
- `packages/arel/src/nodes/with.ts` — `constructor`

Several are overrides of an inherited Rails member (e.g. `left`/`right` on `InfixOperation` /
`JoinSource`, `expr` on `UnaryOperation` / `Window`, `constructor` on `Grouping` / `ValuesList` /
`With`), which `override-of-inherited-rails-member-scores-moved` (RFC 0120) makes the scorer credit.
The rest (`and`/`or`/`not` on `Binary`, `nullsFirst`/`nullsLast` on `Ascending`/`Descending`,
`toString`/`value` on `SqlLiteral`, `eql` on `Attribute`) are real: Rails defines them on a module
(`Arel::Nodes::NodeExpression`, `OrderPredications`, …) the TS class should reach through `include()`.

## Acceptance criteria

- [ ] After `override-of-inherited-rails-member-scores-moved` lands, re-run `pnpm parity:api:extra --package arel` and relocate every remaining node-file moved name onto the file mirroring the `.rb` that defines it (through `include()` where Rails `include`s).
- [ ] `pnpm parity:api:extra:tighten` narrows `arel.total` by the rows burned; nothing is receipted.

## Verification

```bash
pnpm parity:api:extra --package arel && pnpm parity:api:moves && pnpm parity:api:extra:gate && pnpm lint --fix
```
