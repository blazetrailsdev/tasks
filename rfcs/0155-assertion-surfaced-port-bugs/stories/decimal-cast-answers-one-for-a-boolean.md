---
title: "DecimalType#cast answers BigDecimal(1) for a boolean where Rails' to_s fallback answers 0"
status: closed
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise wrong: Rails' Decimal#cast goes through Helpers::Numeric#cast (vendor/rails/activemodel/lib/active_model/type/helpers/numeric.rb:15-28), which maps true->1 and false->0 before cast_value, so Rails answers BigDecimal(1) for cast(true). trails already matches, pinned in decimal.trails.test.ts:112-115. The story's MRI check exercised cast_value(true.to_s) directly and skipped the Numeric prelude."
---

## Context

Surfaced while pinning `decimal.rb:73-77`'s `cast_value(value.to_s)` fallback in
PR trails#7828 (`decimal-cast-value-to-s-fallback`).

`ActiveModel::Type::Decimal#cast_value`
(`vendor/rails/activemodel/lib/active_model/type/decimal.rb:56-77`) reaches a
boolean through its final `else` arm — `true` is not a `::Float`, not a
`::Numeric`, not a `::String`, and does not respond to `to_d` — so Rails answers
`cast_value(true.to_s)` = `BigDecimal("true")` = **`BigDecimal(0)`**. Verified
with MRI: `true.to_s.to_d == 0`.

trails answers `BigDecimal(1)` for `type.cast(true)`
(`packages/activemodel/src/type/decimal.ts`, `castValue`). Something upstream of
the `else` arm — the numeric mixin's coercion, or the `typeof value === "number"`
/ `bigint` branch reached after a JS boolean-to-number widening — takes the
boolean before the `to_s` fallback can. The `to_s` arm itself is correct and is
now pinned for `{}` and `":sym"`; only the boolean path diverges.

`packages/activemodel/src/type/decimal.trails.test.ts`'s
`cast_value falls through to cast_value(value.to_s) for a value with no to_d`
deliberately omits the `true` case for this reason — that omission is the
receipt this story converges.

## Acceptance criteria

- `new DecimalType().cast(true)` answers `BigDecimal(0)`, and `cast(false)`
  answers `BigDecimal(0)` (`false.to_s.to_d == 0`), matching
  `decimal.rb:73-77`'s `else` arm.
- The divergence is traced to the branch that claims the boolean before the
  `else` arm, and that branch is converged rather than special-cased for
  booleans.
- The `true` assertion is restored to the `cast_value falls through to
cast_value(value.to_s)` test in `decimal.trails.test.ts`.
- `pnpm parity:api:calls` / `parity:api:calls:args` stay green with no new
  baseline rows; no `parity:test` percent drop for activemodel or activerecord.
