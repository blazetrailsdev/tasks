---
title: "Attribute#over is an invented surface — WindowPredications is only on Function/Filter"
status: in-progress
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5027
claim: "2026-07-21T12:30:16Z"
assignee: "arel-attribute-over-not-in-window-predications"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while retiring the eleven invented `Attribute` function surfaces
in #5018 (story
`arel-attribute-remaining-invented-function-surfaces`).

`packages/arel/src/attributes/attribute.ts:199-203` defines
`Attribute#over(window?)`, documented as "Mirrors: `OVER` support on Arel
expressions" — a non-citation, the same tell that flagged the eleven
methods retired in #5018 and `coalesce` in #5007.

`over` _is_ real Arel, but it does not belong on `Attribute`. It is
defined in `Arel::WindowPredications#over`
(`vendor/rails/activerecord/lib/arel/window_predications.rb:5`), and that
module is included in exactly two places:

- `vendor/rails/activerecord/lib/arel/nodes/function.rb:6`
- `vendor/rails/activerecord/lib/arel/nodes/filter.rb:6`

`vendor/rails/activerecord/lib/arel/attributes/attribute.rb:6-10` includes
`Expressions`, `Predications`, `AliasPredication`, `OrderPredications`
and `Math` — **not** `WindowPredications`. So in Rails,
`attribute.over(...)` raises `NoMethodError`; the window is applied to the
aggregate/function node (`attribute.sum.over(w)`), not to the bare column.

Verified at runtime against vendored Rails:

```ruby
Arel::Nodes::Function.include?(Arel::WindowPredications)          # => true
Arel::Attributes::Attribute.include?(Arel::WindowPredications)    # => false
```

Note this is a _relocation_, not a retirement like the eleven in #5018 —
check whether `Function`/`Filter` in `packages/arel/src/nodes/` already
surface `over` before removing it from `Attribute`.

## Acceptance criteria

- [ ] `Attribute#over` audited against `window_predications.rb`; removed
      from `Attribute` unless a Rails counterpart is found there.
- [ ] `over` is reachable on the nodes Rails puts it on (`Function`,
      `Filter`) via the FactoryMethods/mixin convention used elsewhere in
      the package.
- [ ] No surviving callers under `packages/` rely on `over` being on a
      bare `Attribute`.
- [ ] The "Mirrors: `OVER` support on Arel expressions" JSDoc is replaced
      with a real `file:line` citation or deleted with the method.
- [ ] api:compare / test:compare delta non-negative.
