---
title: "::DateTime#strftime hands the formatter nsec: 0, so %N and %L always answer zeros"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6161
claim: "2026-08-07T00:48:36Z"
assignee: "datetime-carries-no-fractional-seconds"
blocked-by: null
closed-reason: null
---

## Context

`::DateTime#strftime` hands the shared formatter a literal `nsec: 0`
(`packages/date/src/date.ts:2582`), so `%N` and `%L` always answer zeros for a
`::DateTime` the way they did for `::Time` before PR #6156.

MRI's `::DateTime` carries a fractional second and answers it from
`#sec_fraction` as a Rational:

```ruby
DateTime.new(2008, 3, 1, 6, 0, Rational(1, 2)).strftime("%N")  # => "500000000"
DateTime.new(2008, 3, 1, 6, 0, Rational(1, 2)).sec_fraction    # => (1/2)
DateTime.new(2008, 3, 1, 6, 0, Rational(1, 2)).sec             # => 0
DateTime.parse("2008-03-01T06:00:00.123456789+09:00").strftime("%N")
# => "123456789"
```

Note `#sec` answers the whole second only (`0`, not `1`), exactly as `::Time`
does — the fraction lives in `#sec_fraction`.

This is the second half of [[ruby-time-carries-no-fractional-seconds]]
(PR #6156), whose context named both `::Time` and `::DateTime` as the callers
that could only hand the formatter `0`, but whose acceptance criteria covered
`::Time` only. The formatter side is already done — `date.ts`'s `%N` / `%L`
read `subject.nsec` and pad to nine digits — so this is purely about capturing
and reading back the state.

**Not** in scope: `::Date#strftime`'s `nsec: 0` at `date.ts:2458` is correct
and must stay. Ruby's `::Date` has no time of day at all, and MRI agrees:
`Date.new(2008, 3, 1).strftime("%N") # => "000000000"`.

## Converged shape

`::DateTime` holds sub-second state and `#strftime` passes the real `nsec`,
mirroring what PR #6156 did for `::Time`: the constructor splits a fractional
`sec` rather than truncating it, and `#sec_fraction` reads it back.

Reuse `::Time`'s truncation rule rather than re-deriving it — MRI truncates the
_exact_ double at nine digits rather than rounding the product, which
`packages/date/src/time.ts`'s `subsecNanoseconds` captures by reading the
digits off `toFixed(20)`. `Math.floor(frac * 1e9)` answers `300000000` where
MRI answers `299999999`.

`#sec_fraction` is a Rational in MRI; a JS number is the nearest analogue, as
`Time#subsec` already documents.

## Acceptance criteria

- [ ] `DateTime.new(..., Rational(1, 2))` and the parsed
      `.123456789` form keep the fraction; `strftime("%N")` and `%L` answer
      real digits.
- [ ] `#sec` still answers the whole second only.
- [ ] Integer-second construction is unchanged — `%N` stays `"000000000"`.
- [ ] `::Date#strftime`'s `nsec: 0` is left alone.
- [ ] Verify each behavior against a live `ruby -rdate -e` (`ruby` is on PATH;
      the gem is not vendored under `vendor/rails`).
