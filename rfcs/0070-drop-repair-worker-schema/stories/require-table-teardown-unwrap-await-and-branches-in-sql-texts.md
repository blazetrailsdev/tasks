---
title: "require-table-teardown: unwrap await and fan out branches in createSqlTextGroups"
status: ready
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`createSqlTextGroups` (`eslint/sql-texts.mjs`) resolves a `Literal`, a
`TemplateLiteral`, a `+` chain, an `Identifier` holding one, and — since #5587 —
a `CallExpression` of a local helper. It has NO wrapper unwrapping at all, so a
SQL string reached through any wrapping node resolves to no groups:

```ts
const sql = await buildSweepSql(); // AwaitExpression — dead end
const sql = buildSweepSql() as string; // TSAsExpression — dead end
const sql = cond ? sweepA : sweepB; // ConditionalExpression — dead end
```

An `await`ed helper is the likely spelling once a helper does any async work,
and #5587 made helper calls resolvable without making an awaited one resolvable,
so the closed gap reopens the moment the helper is `async`.

The sibling resolver in the same module family already has exactly this
unwrapping: `unwrapStep` in `eslint/sweep-binding.mjs` handles `AwaitExpression`,
`ChainExpression`, `TSNonNullExpression`, `ConditionalExpression`,
`LogicalExpression` and `MemberExpression`, and its rule doc states the
single-successor boundary (`ConditionalExpression` follows the consequent,
`LogicalExpression` the left). The two resolvers disagreeing about which
wrappings are transparent is the drift both rules' shared-module layout exists to
prevent.

Note the shapes are not identical: `sqlTextGroups` returns a FAN-OUT (a list of
quasi groups), so unlike the single-successor `unwrapStep` it can follow BOTH
branches of a conditional and a logical rather than picking one. That is a
strictly better answer for a fan-out resolver and should be taken deliberately,
not copied from `unwrapStep`'s single-successor compromise.

Direction is under-accepting for `require-table-teardown` (a real sweep goes
unrecognised and its creates report — noise, not a leak) and a miss for
`require-canonical-rebuild`, the same trade #5561, #5572, #5576, #5581 and #5587
took.

## Acceptance criteria

- A sweep whose SQL is reached through `await` credits its prefix / arms
  `sawSweepDrop`, including `await` of a local async helper call.
- A conditional and a logical expression fan out over both operands rather than
  following one, and the doc states why that differs from `unwrapStep`.
- Extend `createSqlTextGroups`; do not add a second resolver, and do not import
  `unwrapStep` into it if the fan-out reading is the correct one.
- The quasi-boundary rule holds: a name or LIKE pattern read across a
  substitution is still never credited as static.
- `require-canonical-rebuild`'s joined reading must not regress.
- Each new valid test must fail on the pre-change resolver.
- `pnpm eslint packages` stays clean, or any newly surfaced raw create gets a
  disable stating why it cannot leak.
