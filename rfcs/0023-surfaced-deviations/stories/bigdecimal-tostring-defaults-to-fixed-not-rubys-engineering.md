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
`BigDecimal#toString(format = "F")` to the FIXED form. Ruby's
`BigDecimal#to_s` with no argument is ENGINEERING notation:

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

### Correction (2026-09-17): ActiveSupport DOES redefine `to_s`

An earlier revision of this story said "ActiveSupport does not redefine it".
That is wrong, and acting on it would fix this bug in one package while
creating its mirror image in another.
`activesupport/lib/active_support/core_ext/big_decimal/conversions.rb` is
exactly a redefinition — it is the whole content of the file:

```ruby
module ActiveSupport
  module BigDecimalWithDefaultFormat # :nodoc:
    def to_s(format = "F")
      super(format)
    end
  end
end
BigDecimal.prepend(ActiveSupport::BigDecimalWithDefaultFormat)
```

Measured against the MRI on PATH through the parity pipeline's Gemfile:

| context                                             | `BigDecimal("123456.789").to_s` |
| --------------------------------------------------- | ------------------------------- |
| bare `require "bigdecimal"`                         | `0.123456789e6`                 |
| `require "active_record"`                           | `0.123456789e6`                 |
| `+ active_support/core_ext/big_decimal/conversions` | `123456.789`                    |

So **the surfacing analysis above stands unchanged**: `require "active_record"`
does not pull the core_ext in, so `MySQL::Quoting#cast_bound_value`'s `Numeric`
arm really does see the engineering form, and `toString("E")` there is right.
What changes is the scope of the fix. `"F"` is genuinely the default once
ActiveSupport's core_ext is loaded, so flipping the class default to `"E"` and
stopping would leave trails' ActiveSupport diverging in the opposite direction:
Rails gives `"F"` to a core_ext-loaded caller, trails would give engineering
form.

Both halves are needed, and they live in different packages. The class and its
Ruby-correct default belong in `@blazetrails/ruby-compat`; the prepend that
flips the default to `"F"` belongs in the `core_ext` file, which currently
implements nothing. The relocation and the prepend port are
`move-big-decimal-to-ruby-compat` (RFC 0154), which depends on this story and
explicitly does not re-fix the default. **Ship this story first**, then that
one — or ship them together.

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

The JSDoc correction says what is actually true: `"F"` is ActiveSupport's
default, applied by a `prepend` this package does not yet port, and the class's
own default is Ruby's `"E"`.

## Acceptance criteria

- [ ] `BigDecimal#toString()` with no argument returns Ruby's engineering form.
- [ ] The JSDoc no longer offers the bare default as ActiveSupport's. `"F"` IS
      ActiveSupport's default, but it comes from a `prepend`
      (`BigDecimalWithDefaultFormat`) that this package does not yet port; the
      JSDoc says that, and points at `move-big-decimal-to-ruby-compat`.
- [ ] Every existing caller of the bare form is audited and passes `"F"` where
      it genuinely wants fixed notation.
- [ ] `toJSON` still emits the `"F"` form (`as_json` semantics unchanged).
- [ ] MySQL `castBoundValue`'s explicit `"E"` is simplified back to the plain
      `Numeric`-arm `to_s`.
- [ ] No behavioral claim in the story or the JSDoc asserts that ActiveSupport
      leaves `BigDecimal#to_s` alone — verified against
      `vendor/rails/activesupport/lib/active_support/core_ext/big_decimal/conversions.rb`.
