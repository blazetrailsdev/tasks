---
title: "Date's #sf is stored as a Rational always, where set_to_complex stores it through canon"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`set_to_complex` stores `sf` through `canon`
(`vendor/ruby/v3.3.11/ext/date/date_core.c:323-331`, `:363`, `:381`), which folds a Rational whose
denominator is 1 to its Integer numerator. So `ComplexDateData`'s `sf` is an Integer for a
whole-nanosecond value and a Rational only for a sub-nanosecond one, and `m_sf` (`:1547-1553`)
answers `INT2FIX(0)` for a simple date. Measured on ruby 3.3.11:

```text
Date.new(2016,1,1).marshal_dump[3]                            # => 0
DateTime.new(2016,1,1,1,2,Rational(7,2)).marshal_dump[3]      # => 500000000
DateTime.new(2016,1,1,1,2,Rational(7,3)).marshal_dump[3]      # => (1000000000/3)
```

trails holds `#sf` as a Rational always (`packages/date/src/date.ts`, `Date#mSf` answers
`this.#sf ?? new Rational(0, 1)`; `DateTime#mSf` answers `this.#sf`), since trails PR 6186. trails
PR 8529 folds it at the one site that hands `sf` out raw, `Date#marshalDump`
(`d_lite_marshal_dump`, `date_core.c:7547-7567`), with an inline
`wholenumP(sf) ? bigNorm(sf.numerator) : sf`, so the dump is byte-equal to MRI's. `canon` itself
is not ported, the store is still uncanonicalized, and `marshalLoad`'s 6-element arm
(`:7609-7617`) re-wraps the Integer with `rational(...)` to feed it.

Callers that do arithmetic on `mSf()` (`minusDd`, `cmpDd`, `plus`, `amjd`, `ajd`, `hash`,
`mSfInSec`, strftime's `nsec`) use `Rational` methods where MRI uses `f_add` / `f_sub` /
`f_zero_p` over an Integer-or-Rational VALUE.

## Acceptance criteria

- [ ] `#sf` is stored through `canon` at every `set_to_complex` site, and `mSf` answers `0` for a
      simple date, as `date_core.c:1547-1553` does.
- [ ] `Date#marshalDump` passes `this.mSf()` with no inline fold, and `marshalLoad` stores
      `a[3]` with no `rational(...)` wrap.
- [ ] `DateTime#secFraction` still answers a Rational unconditionally (`ns_to_sec`, `:993-998`).
- [ ] The `Marshal over Date` tests in `packages/date/src/date.trails.test.ts` stay green.
