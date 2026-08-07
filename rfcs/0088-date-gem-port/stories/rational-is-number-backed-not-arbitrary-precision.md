---
title: "Rational's numerator/denominator are JS numbers where Ruby's are Integers"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6186
claim: "2026-08-07T17:44:45Z"
assignee: "flatten-store-resolve-link-to-sym-parity"
blocked-by: null
closed-reason: null
---

## Context

`packages/date/src/date.ts`'s `Rational` stores `numerator` / `denominator` as
JS numbers. Ruby's are Integers — arbitrary precision — so every reduction,
multiply and divide in `rational.c` is exact at any magnitude, while ours is
exact only inside `Number.MAX_SAFE_INTEGER` (2^53 - 1) and silently wrong past
it.

PR #6177 hit this twice while making `DateTime#sf` exact:

- `Rational#mul` had to cancel the multiplier against the denominator BEFORE
  multiplying, mirroring `f_muldiv`, because
  `(9999999999/10000000000) * 1000000000` — the `sf` for a parsed
  `.9999999999` — forms a 1e19 numerator otherwise and the `iGcd` reduction
  returns garbage. `#quo` needed the same treatment. Cancellation buys
  headroom; it does not remove the ceiling.
- The parse producers build `new Rational(Number(f), 10 ** f.length)` from a
  decimal literal (`date.ts:975`, `:1610`, `:2024`, mirroring
  `rb_rational_new2(str2num(f), f_expt(INT2FIX(10), LONG2NUM(len)))` at
  `vendor/date/ext/date/date_parse.c:2319-2325` and
  `date_strptime.c:377-380`). Both `Number(f)` and `10 ** len` lose exactness
  past sixteen digits, so
  `DateTime.parse("2008-03-01T06:00:00." + "1" * 20).sec_fraction` cannot be the
  exact Rational MRI answers. MRI's is a bignum over `10**20`.

`subsecDigits`' long division (`date.ts:~150`) is likewise exact only while
`denominator * 10` stays inside the safe range — fine for every `sf` reachable
today, unbounded in MRI.

None of this is observable through the values the ported call sites currently
produce, which is why #6177 shipped without it. It becomes observable the
moment a fraction literal longer than sixteen digits, or a `Rational` `second`
with a large denominator, reaches `DateTime`.

## Converged shape

`Rational`'s two fields are `bigint`, as Ruby's Integers are, with `iGcd`
operating on `bigint` — then `mul` / `quo` / `div` / `mod` / `add` are exact at
any magnitude and the cancel-before-multiply in `mul`/`quo` becomes an
optimisation rather than a correctness crutch. `numerator` / `denominator` stay
the Rails names. Readers that hand the value to a `number` seam (`toI`,
`round`, `toString`, the `sql-datetime.ts` narrowing) convert at the boundary.

Check the blast radius first: `Rational` is exported from `@blazetrails/date`
and read by `activemodel`'s `type/time.ts` and `type/date-time.ts`,
`activesupport`'s `message-pack/extensions.ts`, and `date.ts`'s own
`dateZoneToDiff` / `offsetToSec` / `DateTime#offset`. A `bigint` field is a
breaking change at each of those.

## Acceptance criteria

- [ ] `Rational` holds `bigint` numerator and denominator and is exact past
      `Number.MAX_SAFE_INTEGER`.
- [ ] `DateTime.parse("2008-03-01T06:00:00." + "1" * 20).secFraction` equals the
      exact Rational MRI answers, verified against a live `ruby -rdate -e`.
- [ ] `subsecDigits` is exact for a denominator past the safe range.
- [ ] Every existing `Rational` consumer listed above still typechecks and its
      tests pass unchanged in value.
