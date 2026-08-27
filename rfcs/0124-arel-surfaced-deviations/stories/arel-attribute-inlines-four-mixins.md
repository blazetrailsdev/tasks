---
title: "arel: Attribute hand-copies Expressions/Math/AliasPredication/OrderPredications instead of include()"
status: done
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: duplicate-bodies
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 7123
claim: "2026-08-27T15:57:56Z"
assignee: "arel-attribute-inlines-four-mixins"
blocked-by: null
closed-reason: null
---

## Context

`Arel::Attributes::Attribute` gets every non-predication method by `include`
(`vendor/rails/activerecord/lib/arel/attributes/attribute.rb:6-10`:
`Expressions`, `Predications`, `AliasPredication`, `OrderPredications`,
`Math`). trails' `packages/arel/src/attributes/attribute.ts` `include()`s only
`Predications` (attribute.ts:232) and hand-copies the other four modules as own
methods:

- `asc` / `desc` — attribute.ts:116-122 duplicate `order-predications.ts`
  (order_predications.rb:5-11).
- `add` / `subtract` / `multiply` / `divide` / `bitwiseAnd` / `bitwiseOr` /
  `bitwiseXor` / `bitwiseShiftLeft` / `bitwiseShiftRight` / `bitwiseNot` —
  attribute.ts:131-169 duplicate `math.ts` (math.rb:5-45).
- `as` — attribute.ts:171-173 duplicates `alias-predication.ts`
  (alias_predication.rb:5-7).
- `count` / `sum` / `maximum` / `minimum` / `average` / `extract` —
  attribute.ts:183-206 duplicate `expressions.ts` (expressions.rb:5-27).

That is 22 method bodies (~90 lines) that exist once in Rails and twice in
trails, and it is why `attribute.ts` is 234 lines against a 33-line Ruby file
(7.09x — the worst ratio in the package). `expression-mixins.test.ts:8-16`
records the split explicitly ("Attribute pre-dates this PR and ships hand-rolled
versions … Aligning Attribute with Rails' Predications semantics is a separate
refactor").

`index.ts:69-73` already shows the wiring shape for `NodeExpression`; `Attribute`
extends `Node`, not `NodeExpression`, so the five `include()` calls have to be
made for it directly (attribute.ts:232 is where `Predications` is wired today).

## Acceptance criteria

- `attribute.ts` carries no own `asc`, `desc`, `as`, `add`, `subtract`,
  `multiply`, `divide`, `bitwise*`, `count`, `sum`, `maximum`, `minimum`,
  `average`, `extract`; each arrives via `include(Attribute, X)` for
  `Expressions`, `AliasPredication`, `OrderPredications`, `Math`, mirroring
  attribute.rb:6-10 in that order.
- The `interface Attribute extends …` declaration merges the four module
  interfaces instead of restating the signatures.
- `attributes/attribute.test.ts`, `attributes/math.test.ts`,
  `attribute-alignment.test.ts`, `math.test.ts` stay green without renaming a
  test.
- `pnpm parity:api --package arel` stays 957/957; `parity:api:extra:gate` stays
  novel 0 / total ≤ 47.
