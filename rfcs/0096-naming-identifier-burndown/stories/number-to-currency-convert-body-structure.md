---
title: "number-to-currency-convert-body-structure"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6513
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/number-helper/number-to-currency-converter.ts#convert`
does not carry Rails' body
(`vendor/rails/activesupport/lib/active_support/number_helper/number_to_currency_converter.rb:10-25`):

```ruby
def convert
  format = options[:format]

  number_d = valid_bigdecimal
  if number_d
    if number_d.negative?
      number_d = number_d.abs
      format = options[:negative_format] if (number_d * 10**options[:precision]) >= 0.5
    end
    number_s = NumberToRoundedConverter.convert(number_d, options)
  else
    number_s = number.to_s.strip
    format = options[:negative_format] if number_s.sub!(/^-/, "")
  end

  format.gsub("%n", number_s).gsub("%u", options[:unit])
end
```

Three divergences:

1. **No `valid_bigdecimal` branch.** trails does `Number(this.number)` and bails
   with `String(this.number)` when it is not finite; Rails takes the `else` arm,
   which strips a leading `-` off the STRING form and switches to
   `negative_format` when it found one.
2. **The `>= 0.5` rounding guard is missing.** Rails only switches to
   `negative_format` when the value still rounds to something non-zero at
   `options[:precision]` — so `-0.001` at precision 2 formats as `$0.00`, not
   `-$0.00`. trails switches on `num < 0` unconditionally.
3. **`format` is chosen after the fact** rather than seeded from
   `options[:format]` and overridden, and the two `gsub`es run in the opposite
   order (`%u` then `%n`), which is observable when the unit itself contains
   `%n`.

Surfaced while converging the `opts` → `options` / `abs` → `numberD` naming row
in RFC 0096 wave 3 (`naming-burndown-3-activesupport`). The locals now carry the
Rails names, so the remaining gap is purely structural.

## Acceptance criteria

- [ ] `convert` carries number_to_currency_converter.rb:10-25's branches in
      order, including `valid_bigdecimal`, the `>= 0.5` precision guard, and the
      `%n`-then-`%u` substitution order.
- [ ] `valid_bigdecimal` exists under its Rails name
      (`number_converter.rb`), or its absence is justified at the call site.
- [ ] Tests cover the negative-rounds-to-zero case and the non-numeric `else`
      arm, and fail on the baseline.
