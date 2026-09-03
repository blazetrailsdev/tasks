---
title: "BigDecimal caps the exponent at 4000, so a large-exponent string silently casts to zero"
status: draft
updated: 2026-09-03
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
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

Surfaced while landing PR #7421 (bigdecimal-lacks-nan-and-infinity-forms).

`packages/activesupport/src/core-ext/big-decimal/conversions.ts` caps the
decimal exponent it will expand at `MAX_EXPONENT_EXPANSION = 4000` and throws a
`RangeError` past it:

```ts
if (Math.abs(exp) > MAX_EXPONENT_EXPANSION) {
  throw new RangeError(`BigDecimal: exponent magnitude exceeds the ...`);
}
```

MRI has no such cap — `BigDecimal` stores the exponent rather than expanding the
digits, so `"1e10000000".to_d` is an ordinary finite BigDecimal whose
`exponent` is `10000001` (verified on MRI 3.4).

That divergence is now load-bearing rather than hypothetical.
`ActiveModel::Type::Decimal#cast_value`'s String arm
(`activemodel/lib/active_model/type/decimal.rb:64-68`) is:

```ruby
begin
  value.to_d
rescue ArgumentError
  BigDecimal(0)
end
```

so in Rails `type.cast("1e10000000")` is `0.1e10000001`. In trails the
`RangeError` is caught by the ported rescue arm and the value silently becomes
`BigDecimal(0)` — a wrong number, not a rejected one, and it is pinned that way
by `apply_scale does not OOM on adversarial exponents` and `serialize leaves
adversarial exponents as the raw cast string` in
`packages/activemodel/src/type/decimal.trails.test.ts`.

## Converged shape

Carry the exponent instead of expanding it, the way MRI does: keep the
significant digits plus a separate exponent, so an arbitrarily large `e` costs
no allocation and `to_s("F")` / `to_s("E")` / `round` / `<=>` read it. The
allocation guard then has nothing to guard and goes away with the `RangeError`,
and `decimal.ts`'s rescue arm narrows back to what `decimal.rb:64-68` actually
catches.

If the full exponent-carrying representation is too large a change to take at
once, the intermediate step is to stop turning an unrepresentable exponent into
a silent zero.

## Acceptance criteria

- [ ] `new BigDecimal("1e10000000")` is finite and answers exponent `10000001`,
      with no `RangeError` and no multi-megabyte digit string.
- [ ] `type.cast("1e10000000")` answers that BigDecimal rather than
      `BigDecimal(0)`; the two `decimal.trails.test.ts` cases above are updated
      to the MRI values.
- [ ] `MAX_EXPONENT_EXPANSION` and its `RangeError` are gone, or reduced to a
      genuine allocation bound that no representable Ruby value trips.
