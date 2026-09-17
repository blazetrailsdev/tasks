---
title: "BigDecimal moves out of the activesupport core_ext into ruby-compat, and conversions.ts becomes an actual port of the prepend"
status: draft
updated: 2026-09-17
rfc: "0000-ruby-compat-surfaced-deviations"
cluster: "mri-relocation"
packages:
  - "ruby-compat"
  - "activesupport"
deps:
  - "ruby-compat-extra-surface-growth-protocol"
deps-rfc:
  - "0023-surfaced-deviations"
est-loc: 300
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/core-ext/big-decimal/conversions.ts` is 422 lines
against a 14-line Ruby counterpart
(`vendor/rails/activesupport/lib/active_support/core_ext/big_decimal/conversions.rb`)
— the worst LOC ratio in the repo at 30.1x, out of 672 mirrored file pairs
whose median is 1.19x.

The ratio is not bloat. The file hosts a port of Ruby's **`BigDecimal` stdlib
class** (`export class BigDecimal` at `conversions.ts:16`, plus `toD`,
`roundsAway`, `parseFormat`, `groupFromRight`, `groupFromLeft`,
`parseRational`, `leadingZeroCount`, `parse`), whose real upstream is
`vendor/ruby/ext/bigdecimal/bigdecimal.c`, not `vendor/rails`. It is in the
wrong package: `@blazetrails/ruby-compat` is where Ruby core and stdlib
primitives live, and `rational.ts` / `numeric.ts` are already there in exactly
this shape, anchored to `vendor/ruby/*.c` with
`@noRailsEquivalent PERMANENT — Ruby core` receipts.

The dependency arrow already points that way: `conversions.ts:1` imports
`FloatDomainError` from `@blazetrails/ruby-compat`. Moving the class removes
that wrong-direction edge rather than creating one, and `FloatDomainError` is
its only ruby-compat dependency, so the leaf rule
(`scripts/ruby-compat-leaf.ts`) holds.

### The `to_s` default is a SEPARATE, already-filed story

`bigdecimal-tostring-defaults-to-fixed-not-rubys-engineering`
(RFC 0023, `status: draft`) owns flipping `BigDecimal#toString()`'s default from
`"F"` to Ruby's engineering form, and the audit of callers that follows. **This
story does not duplicate it and must not re-fix it.** They compose: that story
fixes the default on the class, this one moves the class to the package where
the default is Ruby's business, and ports the Rails file that overrides it.

**Correction to that story's premise, verified here.** It states "ActiveSupport
does not redefine it". That is false, and the story's `Converged shape` is a
half-fix without this one. `conversions.rb` is exactly a redefinition:

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

Measured against the MRI on PATH via the pipeline Gemfile:

| context                                             | `BigDecimal("123456.789").to_s` |
| --------------------------------------------------- | ------------------------------- |
| bare `require "bigdecimal"`                         | `0.123456789e6`                 |
| `require "active_record"`                           | `0.123456789e6`                 |
| `+ active_support/core_ext/big_decimal/conversions` | `123456.789`                    |

So the 0023 story's MySQL conclusion stands — `require "active_record"` does
not pull the core_ext in, so `MySQL::Quoting#cast_bound_value`'s `Numeric` arm
really does see engineering form. But "ActiveSupport does not redefine it" is
wrong as a general claim, and a fix that flips the default without porting the
prepend leaves trails' ActiveSupport diverging from Rails in the other
direction: a Rails app that loads the core_ext gets `"F"`, and trails would give
engineering form.

Today trails has the inverse problem: `toString(format = "F")` is declared
directly on the class (`conversions.ts:67`), which bakes Rails' prepend into
the stdlib. The 14-line Rails file's actual contribution has **no TS
counterpart implementing it** — the file scores as a 30x port of behavior it
does not contain.

## Acceptance criteria

- The `BigDecimal` class and its module-private helpers move to
  `packages/ruby-compat/src/big-decimal.ts`, anchored to
  `vendor/ruby/ext/bigdecimal/bigdecimal.c` in the `rational.ts` JSDoc style,
  with `@noRailsEquivalent PERMANENT — Ruby core` receipts.
- `packages/activesupport/src/core-ext/big-decimal/conversions.ts` shrinks to
  an actual port of `BigDecimalWithDefaultFormat` — the prepend that flips the
  default to `"F"` — and nothing else. Its LOC ratio against the 14-line Ruby
  file lands in a normal band.
- **The default flip itself is out of scope**, owned by
  `bigdecimal-tostring-defaults-to-fixed-not-rubys-engineering`. Whichever
  ships second reconciles with the other; this story's prepend port is what
  makes that story's flip safe for ActiveSupport consumers, so shipping that
  one first is preferred. Do not close it as part of this work.
- `toD` is placed on whichever side its MRI anchor puts it
  (`bigdecimal/util.rb`'s `String#to_d` is stdlib, so ruby-compat is the likely
  home); it currently carries `@noRailsEquivalent PERMANENT` at
  `conversions.ts:419`.
- The 7 internal import sites are updated:
  `activesupport/src/xml-mini.ts`,
  `number-helper/{number-converter,number-to-rounded-converter,number-to-human-converter,number-to-currency-converter,rounding-helper}.ts`,
  and the `index.ts:264` re-export — which STAYS, so downstream
  `@blazetrails/activesupport` consumers keep working.
- The other 20 `BigDecimal` consumers keep compiling and their behavior is
  unchanged by the move alone (`arel/src/visitors/{to-sql,dot}.ts`,
  `activerecord/src/connection-adapters/{abstract,postgresql,mysql,sqlite3}/quoting.ts`,
  `activerecord/src/connection-adapters/postgresql/oid/{decimal,money}.ts`,
  `activemodel/src/type/{decimal,immutable-string}.ts`,
  `activemodel/src/type/helpers/numeric.ts`,
  `activemodel/src/validations/numericality.ts`,
  `actionpack/src/action-controller/metal/strong-parameters.ts`). The
  behavioral audit of those call sites belongs to the 0023 story.
- A new cross-package subpath needs its 4 registrations (package exports,
  tsconfig references, vitest alias, and the consuming packages' deps).
- `parity:api:extra:gate` is green. This story depends on
  `ruby-compat-extra-surface-growth-protocol`: the moved exports raise
  `ruby-compat`'s `total`, which the only-shrink ratchet cannot currently
  accommodate.

## Prior art

`move-rational-to-ruby-compat` (done, trails#7240) is the direct precedent —
same shape, same package, same receipt style.
