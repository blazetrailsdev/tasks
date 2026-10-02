---
title: "activemodel: Type::Helpers::Numeric is a class factory (applyNumericMixin), not an included module"
status: claimed
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps:
  - activemodel-converge-invented-control-flow-arms-type
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-10-02T18:41:59Z"
assignee: "arel-build-quoted-names-the-sql-literal-arm"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Type::Helpers::Numeric`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/type/helpers/numeric.rb:6-34`)
is a module. `Type::Float`, `Type::Integer` and `Type::Decimal` mix it in with
`include Helpers::Numeric` (`type/float.rb:37`, `type/integer.rb:45`,
`type/decimal.rb:46`), and its `cast` (`numeric.rb:15-29`) and `changed?`
(`numeric.rb:31-34`) reach the next method in the ancestry through `super`.

trails ports it as a class factory: `applyNumericMixin(Base)`
(`packages/activemodel/src/type/helpers/numeric.ts:47`) returns an anonymous
`class NumericType extends Base`, and each type extends the result
(`type/float.ts:5`, `type/integer.ts:9`, `type/decimal.ts:7` —
`const NumericValueType = applyNumericMixin(ValueType<…>)`). So the module is a
superclass rather than an included module, `Numeric` is not a name the file
exports, and `Float.ancestors` has an extra anonymous class where Ruby has the
module. It carries
`@noRailsEquivalent CONVERGEABLE type-helpers-numeric-is-a-class-factory-not-an-included-module`.

A module whose methods call `super` is portable: CLAUDE.md § "Call-time constant
resolution" records `ActionView::RoutingUrlFor#url_for`'s `super` as a real
`super` through a live `Module` whose link is spliced into the includer's
ancestry. § "Module mixins" is the idiom; it does not ratify a class factory.

`cast` also diverges inside the factory: Rails tests `value <=> 0`
(`numeric.rb:18`) and falls to `value.presence` (`numeric.rb:24`); the port
tests `typeof value === "number" || "bigint"` and `value.trim() === ""`.

Found by `activemodel-audit-permanent-receipts-subdirs`.

## Acceptance criteria

- [ ] `Numeric` is a module in `type/helpers/numeric.ts` holding `serialize`,
      `serializeCastValue`, `cast`, `isChanged` and the three private helpers at
      their Rails names, with `cast` / `isChanged` reaching `super`.
- [ ] `FloatType`, `IntegerType` and `DecimalType` `include()` it and extend
      `ValueType` directly; `applyNumericMixin`, `NumericMixinMethods` and the
      receipt are deleted.
- [ ] `cast`'s numeric test is the `<=>` send and its fallback is `presence`.
- [ ] `pnpm parity:api:extra --package activemodel` does not list `applyNumericMixin`.

## Verification

```bash
pnpm parity:api:extra --package activemodel && pnpm parity:api:calls && pnpm vitest run packages/activemodel/src/type
```
