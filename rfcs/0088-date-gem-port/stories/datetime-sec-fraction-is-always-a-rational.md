---
title: "DateTime#sec_fraction answers a Rational unconditionally, as ns_to_sec does"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6186
claim: "2026-08-07T17:44:45Z"
assignee: "flatten-store-resolve-link-to-sym-parity"
blocked-by: null
closed-reason: null
---

## Context

`d_lite_sec_fraction` is `m_sf_in_sec(dat)` over `ns_to_sec`
(`vendor/date/ext/date/date_core.c:1568-1572`, `:993-998`), and `ns_to_sec` is
`rb_rational_new2(ns, INT2FIX(SECOND_IN_NANOSECONDS))` — it answers a
**Rational unconditionally**, whatever it is handed. The doc comment on the
method says so outright (`date_core.c:5623`, `sec_fraction -> rational`), and
MRI proves it for the whole-second case:

```text
ruby 3.3.11: DateTime.new(2008, 3, 1, 6, 0, Rational(2)).sec_fraction
             # => (0/1)          <- a Rational, not an Integer
             DateTime.new(2001, 2, 3, 4, 5, 6.5).sec_fraction
             # => (1/2)
```

PR #6177 (story `datetime-sf-is-a-number-not-a-rational`) made `#sf` hold the
Rational where the value carries a sub-nanosecond tail, but left the
whole-nanosecond case a JS number, so `secFraction` is typed
`number | Rational` and answers `0` / `0.5` where MRI answers `(0/1)` / `(1/2)`.
That was deliberate and is recorded in that story's acceptance criteria — "every
existing number-argument value is unchanged" — to keep the PR reviewable, not
because the union is right.

The union is load-bearing on callers: `packages/date/src/date.ts`'s
`StrftimeSubject.nsec`, `subsecDigits`, `secToNs` / `nsToSec` and
`DateTime`'s constructor each carry an `instanceof Rational` arm that exists
only because the number arm still exists. `sql-datetime.ts:78` narrows it too.

## Converged shape

`#sf` is always a `Rational`, as `ComplexDateData`'s is
(`date_core.c:215-231`), and `nsToSec` answers `rb_rational_new2`'s Rational
unconditionally, so `secFraction: Rational` with no union. Every
`instanceof Rational` arm listed above collapses to the Rational path, and
`subsecDigits` reads `numerator`/`denominator` with no number branch.

Expect churn in the tests that currently assert plain numbers
(`date.trails.test.ts`, `expect(...secFraction).toBe(0.5)` and friends) — those
become `toEqual(new Rational(1, 2))`, which is what MRI prints.

Note the constructor keeps two arms regardless, and correctly: `d_lite_plus`'s
T*FLOAT arm rounds to a whole nanosecond (`date_core.c:6094-6097`) where the
T_RATIONAL arm is exact (`:6174-6201`). That is Rails' own control flow, not a
union artifact — only the \_storage* type collapses.

## Acceptance criteria

- [ ] `DateTime#secFraction` is typed `Rational` and answers one for every
      input, including `DateTime.new(2008, 3, 1, 6, 0, Rational(2)).secFraction`
      → `(0/1)` and `DateTime.new(2001, 2, 3, 4, 5, 6.5).secFraction` → `(1/2)`.
- [ ] `#sf`, `StrftimeSubject.nsec`, `secToNs` / `nsToSec` lose their
      `number | Rational` unions and the `instanceof Rational` arms that serve
      them.
- [ ] `sql-datetime.ts:78` reads the Rational directly.
- [ ] Every changed value verified against a live `ruby -rdate -e`.
