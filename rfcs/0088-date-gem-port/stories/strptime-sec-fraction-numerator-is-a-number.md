---
title: "date__strptime's %N numerator is a JS number where MRI's is a bignum"
status: done
updated: 2026-08-08
rfc: "0088-date-gem-port"
cluster: null
packages:
  - date
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6192
claim: "2026-08-07T18:48:45Z"
assignee: "strptime-sec-fraction-numerator-is-a-number"
blocked-by: null
closed-reason: null
---

## Context

PR #6186 (story `rational-is-number-backed-not-arbitrary-precision`) made
`Rational` `bigint`-backed and fixed the two `Date._parse` fraction producers
to build an exact numerator:

```ts
hash.secFraction = new Rational(BigInt(f), 10n ** BigInt(f.length));
```

mirroring `sec_fraction` at `vendor/date/ext/date/date_parse.c:2318-2325`:

```c
sec_fraction(VALUE f)
{
    return rb_rational_new2(str2num(f),
                            f_expt(INT2FIX(10),
                                   LONG2NUM(RSTRING_LEN(f))));
}
```

The `%N` / `%L` arm of `date__strptime_internal` was left half-converged.
`packages/date/src/date.ts` (the `case "N"` / `case "L"` arm of
`dateStrptimeInternal`) now reads:

```ts
hash.secFraction = new Rational(n, 10n ** BigInt(si - osi));
```

The **denominator** is exact, but `n` still comes from `readDigitsAt(...)` /
`readDigitsMax()`, which answer a JS `number`. Past sixteen digits that
numerator has already lost precision before the `Rational` is built, so the
value is wrong even though the denominator is right.

`vendor/date/ext/date/date_strptime.c:377-380` is the counterpart, and it is a
bignum the whole way:

```c
set_hash("sec_fraction",
         rb_rational_new2(str2num(rb_str_new(&str[osi], si - osi)),
                          f_expt(INT2FIX(10), LONG2NUM(si - osi))));
```

`str2num` on the digit substring — never a C double.

Not observable through `Date.parse` (a different producer, already converged),
only through `Date._strptime` / `DateTime.strptime` with a `%N` of more than
sixteen digits.

## Converged shape

`readDigitsAt` / `readDigitsMax` keep the digit **substring** alongside (or
instead of) the `number` they answer, so the arm can build
`new Rational(BigInt(digits), 10n ** BigInt(si - osi))` — `str2num` over the
same span the denominator's exponent is taken from. The `sign === -1` negation
applies to the bigint numerator.

Note the two readers have other callers that genuinely want a `number`
(`%Y`, `%m`, …), so the substring is an addition at the `%N`/`%L` call site
rather than a change of return type for everyone.

## Acceptance criteria

- [ ] `Date._strptime("2008-03-01T06:00:00." + "1" * 20, "%FT%T.%N")`'s
      `:sec_fraction` equals the exact Rational MRI answers, verified against a
      live `ruby -rdate -e`.
- [ ] `DateTime.strptime` over the same input round-trips through `%20N`.
- [ ] The existing `%N` / `%L` strptime cases keep their values unchanged.
