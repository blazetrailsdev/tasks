---
title: "BigDecimal moves out of the activesupport core_ext into ruby-compat, restoring Ruby's scientific to_s default"
status: draft
updated: 2026-09-17
rfc: "0000-ruby-compat-surfaced-deviations"
cluster: "mri-relocation"
packages:
  - "ruby-compat"
  - "activesupport"
deps:
  - "ruby-compat-extra-surface-growth-protocol"
deps-rfc: []
est-loc: 330
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

**The move also fixes a fidelity bug.** Ruby's `BigDecimal#to_s` defaults to
scientific notation; the whole purpose of the 14-line Rails core_ext is to flip
that default to `"F"`:

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

Verified against MRI on this machine:

```ruby
BigDecimal("1234.5").to_s      #=> "0.12345e4"
BigDecimal("1234.5").to_s("F") #=> "1234.5"
```

trails declares `toString(format = "F")` directly on the class
(`conversions.ts:67`), which bakes Rails' prepend into the stdlib class. Two
consequences: a trails caller reaching `BigDecimal` without ActiveSupport gets
Rails' formatting where Ruby gives scientific notation, and
`conversions.rb`'s actual contribution has no TS counterpart implementing it —
the file scores as a 30x port of behavior it does not contain.

## Acceptance criteria

- The `BigDecimal` class and its module-private helpers move to
  `packages/ruby-compat/src/big-decimal.ts`, anchored to
  `vendor/ruby/ext/bigdecimal/bigdecimal.c` in the `rational.ts` JSDoc style,
  with `@noRailsEquivalent PERMANENT — Ruby core` receipts.
- In ruby-compat the default matches Ruby: `toString(format = "E")` (or
  whatever spelling reproduces `"0.12345e4"` for `BigDecimal("1234.5")`), with
  a test asserting the MRI output above.
- `packages/activesupport/src/core-ext/big-decimal/conversions.ts` shrinks to
  an actual port of `BigDecimalWithDefaultFormat` — the prepend that flips the
  default to `"F"` — and nothing else. Its LOC ratio against the 14-line Ruby
  file lands in a normal band.
- `toD` is placed on whichever side its MRI anchor puts it
  (`bigdecimal/util.rb`'s `String#to_d` is stdlib, so ruby-compat is the
  likely home); it currently carries `@noRailsEquivalent PERMANENT` at
  `conversions.ts:419`.
- The 7 internal import sites are updated: `activesupport/src/xml-mini.ts`,
  `number-helper/{number-converter,number-to-rounded-converter,number-to-human-converter,number-to-currency-converter,rounding-helper}.ts`,
  and the `index.ts:264` re-export — which STAYS, so downstream
  `@blazetrails/activesupport` consumers keep working.
- **The `to_s` default change is behavioral.** Every consumer relying on the
  implicit `"F"` is audited and passes `"F"` explicitly where it needs Rails'
  format. The 20 files referencing `BigDecimal` include
  `arel/src/visitors/{to-sql,dot}.ts`,
  `activerecord/src/connection-adapters/{abstract,postgresql,mysql,sqlite3}/quoting.ts`,
  `activerecord/src/connection-adapters/postgresql/oid/{decimal,money}.ts`,
  `activemodel/src/type/{decimal,immutable-string}.ts`,
  `activemodel/src/type/helpers/numeric.ts`,
  `activemodel/src/validations/numericality.ts`, and
  `actionpack/src/action-controller/metal/strong-parameters.ts`. SQL
  quoting is the highest-risk path — a decimal silently quoted as
  `0.12345e4` would be a live bug.
- A new cross-package subpath needs its 4 registrations (package exports,
  tsconfig references, vitest alias, and the consuming packages' deps).
- `parity:api:extra:gate` is green. This story depends on
  `ruby-compat-extra-surface-growth-protocol`: the moved exports raise
  `ruby-compat`'s `total`, which the only-shrink ratchet cannot currently
  accommodate.

## Prior art

`move-rational-to-ruby-compat` (done, trails#7240) is the direct precedent —
same shape, same package, same receipt style.
