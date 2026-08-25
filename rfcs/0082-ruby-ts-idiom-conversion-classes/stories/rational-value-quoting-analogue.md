---
title: "Port a Rational analogue so bind-parameter suites pin 0/1"
status: ready
updated: 2026-07-28
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Rational` has no trails analogue, so the bind-parameter suites cannot
pin how a rational value renders into a bind position. Rails renders it through
the `Numeric` arm of `quote` (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:81-84`),
bare and unquoted, so `Rational(0)` becomes the SQL literal `0/1`.

Both `BindParameterTest` ports assert this case with a plain `Number` stand-in:

- `packages/activerecord/src/adapters/sqlite3/bind-parameter.test.ts:47-51`
  (`test_where_with_rational_for_string_column_using_bind_parameters`,
  `vendor/rails/activerecord/test/cases/adapters/sqlite3/bind_parameter_test.rb:31-33`)
- `packages/activerecord/src/adapters/postgresql/bind-parameter.test.ts:58-62`
  (same test name,
  `vendor/rails/activerecord/test/cases/adapters/postgresql/bind_parameter_test.rb`)

With the stand-in the case is byte-identical to the integer case above it
(`assertQuotedAs("0", 0)`), so each suite has six test names but only five
distinct assertions — the rational case pins nothing. Surfaced in review of
PR #5502.

The precedent is `BigDecimal`: trails ports it as a real class
(`packages/activesupport/src/core-ext/big-decimal/conversions.ts`) and `quote`
dispatches on it ahead of the numeric arm
(`packages/activerecord/src/connection-adapters/abstract/quoting.ts:126-134`,
mirroring Rails `quoting.rb:81`). PR #5502 used that class to converge the
_decimal_ case in the sqlite3 suite to Rails' literal `0.0`; the rational case
has no such class to reach for. This belongs to RFC 0082 as one more Ruby
wrapper class needing a TS conversion analogue.

Also in scope as a smaller sibling question: the float case
(sqlite3 `:32-37`, `test_where_with_float_for_string_column_using_bind_parameters`,
rb`:19-21`) expects Rails' literal `0.0` but JS has a single `Number` type, so
`0.0 === 0` and the adapter renders `0`. Unlike `Rational`, that may be terminal
— decide explicitly rather than leaving it undecided.

## Acceptance criteria

- [ ] A `Rational` analogue lands in `@blazetrails/activesupport` core-ext
      alongside `BigDecimal`, with `toString()` matching Ruby's
      `Rational#to_s` (`0/1`, i.e. always `numerator/denominator`).
- [ ] `quote` / `typeCast` in
      `connection-adapters/abstract/quoting.ts` render it bare, per Rails'
      `Numeric` arm (`quoting.rb:81-84`) — not string-quoted.
- [ ] Both bind-parameter suites pass a real rational zero and assert Rails'
      literal `0/1`, replacing the `Number` stand-in; the call-site deviation
      comments come out with it.
- [ ] The float case is resolved either way: converged, or documented in-code as
      a terminal JS-type limitation with the reasoning (JS has one `Number`
      type) — not left as an open stand-in.
- [ ] Test names unchanged in both suites.
