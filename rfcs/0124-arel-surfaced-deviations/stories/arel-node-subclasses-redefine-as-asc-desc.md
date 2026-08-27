---
title: "arel: six node subclasses redefine as/asc/desc the NodeExpression mixins already supply"
status: claimed
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: duplicate-bodies
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-08-27T15:57:56Z"
assignee: "arel-attribute-inlines-four-mixins"
blocked-by: null
closed-reason: null
---

## Context

In Rails `as`, `asc`, `desc` reach every expression node once, through
`NodeExpression`'s includes (`vendor/rails/activerecord/lib/arel/nodes/node_expression.rb:6-10`)
or the class's own `include AliasPredication` (`binary.rb`/`unary.rb` do not
redefine them). trails wires those mixins at `packages/arel/src/index.ts:69-86`
and then redefines the same methods as own bodies on individual subclasses:

- `nodes/case.ts:92` `as`
- `nodes/extract.ts:29` `as`
- `nodes/binary.ts:149` `as`
- `nodes/grouping.ts:31` `as`
- `nodes/infix-operation.ts:37-47` `as`, `asc`, `desc`
- `nodes/unary-operation.ts:25-35` `as`, `asc`, `desc`

(`nodes/function.ts:36` `as` is a genuine Rails override — function.rb:17-20 —
and stays.) Each copy is byte-equivalent to `alias-predication.ts` /
`order-predications.ts`; `parity:api:extra` scores them "moved" (0 novel, 47
total), so the gate is green while the same Rails method exists in nine
places. Some copies were added to work around the property-vs-method override
error (see node-expression.ts:47-50); the `PredicationsModule`-style
method-syntax interfaces now exist for every mixin, so that workaround is no
longer needed.

## Acceptance criteria

- The six files above define no own `as` / `asc` / `desc`; the methods resolve
  through the `include()` wiring in `index.ts`.
- `nodes/case.test.ts` "allows aliasing", `nodes/extract.test.ts` "should alias
  the extract", `nodes/unary-operation.test.ts`, `nodes/infix-operation.test.ts`
  and `nodes/grouping.test.ts` stay green, no test renamed.
- `parity:api:extra --package arel` total drops below 47 and the mark is
  tightened with `pnpm parity:api:extra:tighten`.
