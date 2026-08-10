---
title: "Date::Infinity rejects NaN at construction where Ruby stores nil, and coerce's super arm is hand-written"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6314
claim: "2026-08-10T00:56:48Z"
assignee: "converge-date-infinity-nan-and-coerce-arms-to-lib-date-rb"
blocked-by: null
closed-reason: null
---

## Context

Shipped in #6308 (`port-date-infinity-from-lib-date-rb`). `Date::Infinity#initialize`
is `vendor/date/lib/date.rb:19`:

```ruby
def initialize(d=1) @d = d <=> 0 end
```

`Float::NAN <=> 0` is `nil`, so Ruby BUILDS the object and stores `nil`. Every
later reader then raises or falls through off that stored `nil`:

- `infinite?` — `d.nonzero?` (`lib/date.rb:27`) raises `NoMethodError`
- `nan?` — `d.zero?` (`lib/date.rb:28`) raises `NoMethodError`
- `-@` / `+@` — `self.class.new(-d)` (`lib/date.rb:32-33`) raises `NoMethodError`
- `coerce` — `return -d, d` (`lib/date.rb:52`) raises `NoMethodError`
- `<=>` — `d <=> other.d` / the `Numeric` arm returning `d` (`lib/date.rb:36-40`)
  answers `nil`, no raise
- `to_f` — `@d > 0` (`lib/date.rb:61`) raises `NoMethodError`

trails (`packages/date/src/date.ts`, `DateInfinity`) instead REJECTS the NaN at
the constructor: `Math.sign(NaN)` is `NaN`, which would have made `isInfinite()`
answer `NaN`, `isNan()` answer `false` and `toF()` answer `-Infinity` — all
wrong-result bugs — so the constructor throws a `TypeError`. The deviation is
documented at the call site and was accepted in review as the actionable fix for
the wrong results, but it is a deviation: Ruby raises LATER, per reader, and from
`NoMethodError`.

The blocker is that JS raises on none of Ruby's `nil`-receiver sites — `-null` is
`-0`, `null > 0` is `false`, `null !== 0` is `true` — so deferring the failure
means inventing an explicit raise in each of the six bodies above, which is
exactly the extra control flow CLAUDE.md forbids. Converging needs either a
trails `NoMethodError` analogue with a `nil`-receiver guard idiom, or a decision
that the constructor boundary is the ratified shape.

Secondary, same class, same file: `Date::Infinity#coerce`'s `else` arm is `super`
— `Numeric#coerce`, i.e. `[Float(other), Float(self)]` (`lib/date.rb:51-57`).
trails throws a `TypeError` with a hand-written message and does not model
`Float()`'s `ArgumentError` arm for an unparseable String. Documented at the call
site as unreachable for the `:nodoc:` class, but it is a message/error-class
divergence.

## Acceptance criteria

- [ ] `Date::Infinity.new(Float::NAN)` BUILDS, as `lib/date.rb:19` does, and the
      six readers above raise or answer exactly what Ruby's `nil` `@d` produces —
      or the constructor boundary is explicitly ratified with a maintainer sign-off
      recorded here.
- [ ] `Date::Infinity#coerce`'s `else` arm answers what `Numeric#coerce` answers,
      including the error class and message for each of `Float()`'s arms.
- [ ] Coverage lands in `packages/date/src/date.trails.test.ts` alongside the
      existing `Date::Infinity` describe.
