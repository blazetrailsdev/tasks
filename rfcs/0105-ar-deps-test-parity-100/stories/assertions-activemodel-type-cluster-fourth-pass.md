---
title: "assertions-activemodel-type-cluster-fourth-pass"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6643
claim: "2026-08-17T11:37:51Z"
assignee: "assertions-activemodel-type-cluster-fourth-pass"
blocked-by: null
closed-reason: null
---

## Context

Cut from `assertions-activemodel-remainder-third-pass` (PR under the 700-LOC
ceiling). That PR converged `type/integer_test.rb`,
`type/serialize_cast_value_test.rb`, `type/date_time_test.rb` and `type_test.rb`
to 0/0/0, lowering the activemodel assertion mark from 415/623/65 to
403/596/61. `type/decimal_test.rb` (5 count / 8 kind / 0 value) was built and
validated locally but reverted for size; this story lands it, plus the two
`type/*` files that need a call on inexpressible Ruby.

### `type/decimal_test.rb` — 5/8/0, three source changes required

The work was done and green locally; the diff is saved at
`/mnt/theta/trails/decimal-rational-arm.patch` (apply with `git apply`, then
re-verify — it was cut from `bc14d32de`).

1. **Rational arm** — `decimal.rb:64-66` routes a `::Numeric` that is not a
   `::Float` through `BigDecimal(value, precision || BIGDECIMAL_PRECISION)`.
   `packages/activemodel/src/type/decimal.ts`'s `_castWithoutScale` has no
   Rational branch. `Rational` is exported from `@blazetrails/date`, which
   activemodel already depends on. Add the `BIGDECIMAL_PRECISION = 18` constant
   (missing entirely) and expand the fraction by exact `bigint` long division —
   never through a float, which loses digits well before 18 — then round to
   `precision` significant digits half-up. Verified against MRI:
   `BigDecimal(Rational(1,3), 18).to_s == "0.333333333333333333e0"`,
   `BigDecimal(Rational(2,3), 2).to_s == "0.67e0"`.

2. **`convert_float_to_big_decimal` applies scale FIRST** — `decimal.rb:75-81`
   is `BigDecimal(apply_scale(value), float_precision)`. Our port elides the
   inner `apply_scale` (there is a JSDoc paragraph ratifying that as a
   deviation) and applies scale only in the outer `castValue` step. That is
   exactly the bug `test_scale_is_applied_before_precision_to_prevent_rounding_errors`
   names: with `precision: 5, scale: 3`, `cast(1.250473853637869)` gives
   `1.251` instead of Rails' `1.250`. Fix: call `applyScale` inside
   `convertFloatToBigDecimal` before the significant-digit round, and delete the
   deviation paragraph. This needs `roundFloatToSignificantDigits` split into a
   string-taking core (`roundDecimalStringToSignificantDigits`) — keep the
   number-taking export, `validations/numericality.ts:530` calls it.

3. **`to_d` arm** — `decimal.rb:73-77`'s `else` branch is
   `value.respond_to?(:to_d) ? value.to_d : cast_value(value.to_s)`. Our port
   returns `null`. `test_type_cast_decimal_from_object_responding_to_d` needs
   the `toD` half. NOTE: the `to_s.to_d` fallback half is a real gap too but has
   a wide blast radius — Rails answers `BigDecimal(0)` for `cast({})` and
   `cast(:sym)` (verified: `{}.to_s.to_d == 0.0`), where trails answers `null`.
   Land the `toD` half with this story; take the `to_s` fallback separately, with
   an AR-wide run.

Also in this file: our test asserts `expect(type.cast("")).toBe(null)` where
Rails uses `assert_nil` — use `toBeNull()`, and `toBeTruthy`/`toBeFalsy` for
`changed?`'s `assert`/`assert_not` arms. Move the trails-only
`convertFloatToBigDecimal:` / `apply_scale ...` tests out of the `DecimalTest`
describe into `decimal.trails.test.ts`.

### `type/registry_test.rb` — 3/3/0, needs a judgement call

All three tests are Ruby-metaprogramming: `registry.register(:foo, ::String)`
then `lookup(:foo) == ""` (`String.new`), `lookup(:bar, 2, :a) == [:a, :a]`
(`Array.new(2, :a)`), a block taking `|type, *args|` and another taking
`|type, **kwargs|`, and an error message asserting `"Unknown type :foo"` where
our registry raises `"Unknown type: foo"` (registry.rb:26 is
`"Unknown type #{symbol.inspect}"` — the colon is part of the Symbol's inspect,
so ours is genuinely wrong and worth converging on its own). Decide per test
whether a faithful TS spelling exists; where it does not, say so at the call
site rather than asserting something else under the Rails name.

### `type/string_test.rb` — 3/3/0, two tests are inexpressible

`test_cast_strings_are_mutable` and `test_values_are_duped_coming_out` assert
`frozen?` and `assert_not_same` on String receivers. JS strings are immutable
primitives with no identity, so neither concept has a counterpart.
`test_type_casting_for_database` DOES converge: `immutable_string.rb`'s
`serialize` sends `::Numeric`/`Duration` to `to_s`, `true`/`false` to
`@true`/`@false`, and everything else — an Object, an Array, a Hash — to
`super`, i.e. straight through. Ours asserts only string/number.

### `type/float_test.rb` and `type/binary_test.rb` — 3/3 and 1/2

`float_test`'s `test_changing_float` is 9 `assert`/`assert_not` calls on
`changed?`, two of which use `BigDecimal("0.0") / 0` (trails' NaN decimal is
the `"NaN"` sentinel — see the pattern already used in `decimal.test.ts`'s
`changed?`). `binary_test` turns on `Encoding::BINARY` and `"ƒée".b`, which the
existing port already documents as inexpressible; the `assert_nil`/
`assert_not_equal` arms of `test_type_cast_binary` may still be portable.

## Acceptance criteria

- `type/decimal_test.rb` reports 0 assertion-count / -kind / -value mismatches
  in `pnpm parity:test -- --assertions --package activemodel`.
- Every other file taken on either reaches 0/0/0 or carries a call-site note
  saying which specific Ruby construct has no TS spelling.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by exactly this
  story's contribution; never raised.
- No test name changes; `pnpm parity:test` percent for activemodel does not drop.
- No new rows in `scripts/parity/unported-files/`.
- Ship what fits one PR and file the rest as a further sibling story.
