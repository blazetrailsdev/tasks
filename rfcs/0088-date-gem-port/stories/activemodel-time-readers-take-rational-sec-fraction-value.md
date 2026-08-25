---
title: "Type::Time#cast_value and #microseconds take a Rational :sec_fraction's value instead of carrying it"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6182
claim: "2026-08-07T17:05:48Z"
assignee: "activemodel-time-readers-take-rational-sec-fraction-value"
blocked-by: null
closed-reason: null
---

## Context

PR #6176 made `DateParts.secFraction` a `number | Rational`, because
`rt_rewrite_frags` (`vendor/date/ext/date/date_core.c:3839-3872`) now carries a
`Rational` `:offset` into `:sec_fraction` exactly, as `f_add` does.

Two `activemodel` readers of that frag take the Rational's value instead of
carrying it:

- `packages/activemodel/src/type/time.ts`, `Type::Time#cast_value`
  (`activemodel/lib/active_model/type/time.rb:68-83`) hands `new_time` the raw
  `:sec_fraction` — Rails passes the Rational straight through as `Time.utc`'s
  microsecond argument, and the JSDoc above the method documents that this is
  what reproduces `Type::Time.new.cast("14:23:55.123456").nsec == 123`. The
  port divides `numerator / denominator` first because `newTime`'s `microsec`
  parameter is a `number`.
- `packages/activemodel/src/type/date-time.ts`, `#microseconds`
  (`activemodel/lib/active_model/type/date_time.rb:62-64`,
  `(time[:sec_fraction] * 1_000_000).to_i`) is already exact on the Rational
  arm via `Rational#mul(...).toI()`, but it is a two-arm body where Ruby has
  one polymorphic line.

Neither is reachable with a Rational today: `Date._parse` — the only producer
these two call — never sets `:seconds`, so it never yields a Rational
`:sec_fraction`. The gap is latent, not observable, which is why #6176 left it.

Related: `datetime-sf-is-a-number-not-a-rational` (0088) is the same narrowing
one layer down, in `DateTime`'s own `sf` field.

## Converged shape

`newTime`'s `microsec` parameter accepts what Ruby's `Time.utc` accepts, so
`cast_value` can pass `:sec_fraction` through unchanged, and `#microseconds`
collapses back to Ruby's single `(sec_fraction * 1_000_000).to_i` line over a
numeric tower that has both arms.

## Acceptance criteria

- [ ] `Type::Time#castValue` passes `:sec_fraction` to `newTime` without a
      `numerator / denominator` division.
- [ ] `#microseconds` is one expression again, matching date_time.rb:62-64.
- [ ] A Rational `:sec_fraction` reaching either method produces the value ruby
      3.3.11 produces, verified against the interpreter.
