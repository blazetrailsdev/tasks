---
title: 'BigDecimal#toString defaults to "F", where Ruby''s BigDecimal#to_s is engineering notation'
status: draft
updated: 2026-08-26
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/core-ext/big-decimal/conversions.ts:84` defaults
`BigDecimal#toString(format = "F")` to the FIXED form, and its JSDoc
(`:69-73`) justifies that as "matching ActiveSupport's defaulted
`BigDecimal#to_s`". That justification is false. Ruby's `BigDecimal#to_s` with
no argument is ENGINEERING notation, and ActiveSupport does not redefine it:

```console
$ ruby -rbigdecimal -e 'puts BigDecimal("123456.789").to_s'
0.123456789e6
$ ruby -rbigdecimal -e 'puts BigDecimal("123456.789").to_s("F")'
123456.789
```

(verified on the MRI on PATH). The two forms coincide only for values whose
mantissa and exponent happen to line up — `BigDecimal(0).to_s` is `"0.0"`
either way — which is why the divergence survived: every existing call site and
test that pinned it used such a value.

Surfaced in #7095 while porting `MySQL::Quoting#cast_bound_value`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/quoting.rb:54-69`).
Because `BigDecimal < Numeric` in Ruby, a BigDecimal lands on `when Numeric
then value.to_s` (rb:58-59) — the bare, engineering-form `to_s` — and the
literal `when BigDecimal then value.to_s("F")` arm beneath it (rb:60-61) is
shadowed and never runs. The first cut of that port called `String(value)`,
which resolved to the `"F"` default and silently produced the wrong literal for
every BigDecimal except the one the Rails test happens to use. It ships as an
explicit `value.toString("E")` with a call-site comment, precisely because the
default cannot be trusted.

`toString("E")` itself is correct and already matches MRI
(`0.123456789e6`, `0.12345e4`, `0.0` — pinned in
`packages/activerecord/src/connection-adapters/mysql/quoting.trails.test.ts`).
The bug is only which form is the DEFAULT, plus a JSDoc claim that actively
misleads the next porter into `String(value)`.

## Converged shape

Flip the default to `"E"` so a bare `toString()` / `String(bigDecimal)` gives
Ruby's `to_s`, and correct the JSDoc to say so. Every existing caller that
wants the fixed form must then pass `"F"` explicitly, exactly as Ruby does —
audit them, since a caller relying on the current default changes behaviour
silently. `toJSON` (`:104-106`) already passes `"F"` explicitly and is
unaffected; that one is correct, because ActiveSupport's `BigDecimal#as_json`
really does use the fixed form.

Once the default is Ruby's, the explicit `"E"` at
`connection-adapters/mysql/quoting.ts`'s `castBoundValue` can drop back to a
bare `String(value)` in the `Numeric` arm, which is what Rails' `to_s` is.

## Acceptance criteria

- [ ] `BigDecimal#toString()` with no argument returns Ruby's engineering form.
- [ ] The JSDoc no longer claims `"F"` is ActiveSupport's default.
- [ ] Every existing caller of the bare form is audited and passes `"F"` where
      it genuinely wants fixed notation.
- [ ] `toJSON` still emits the `"F"` form (`as_json` semantics unchanged).
- [ ] MySQL `castBoundValue`'s explicit `"E"` is simplified back to the plain
      `Numeric`-arm `to_s`.
