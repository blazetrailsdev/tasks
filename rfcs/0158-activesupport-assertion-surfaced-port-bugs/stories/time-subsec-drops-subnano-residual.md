---
title: "Time#subsec drops the sub-nanosecond residual"
status: in-progress
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8085
claim: "2026-09-25T14:11:37Z"
assignee: "time-subsec-drops-subnano-residual"
blocked-by: null
closed-reason: null
---

## Context

trails#8044 gave `Time` (`packages/date/src/time.ts`) a private `#subnano` field: the part of MRI's exact `timew` below the nanosecond `#instant`, a Rational in `[0, 1)` ns. `toR`, `compare`, `eql`, `minus`, `#timeAdd`, `getlocal`, `getutc`, `Time.at` and `strftime`'s `%N` all read it. `get subsec` (`time.ts`, `new Rational(this.nsec, 1_000_000_000)`) does not, so it truncates at the nanosecond.

MRI `time_subsec` (`vendor/ruby/time.c`) is `quov(w2v(wmod(tobj->timew, WINT2FIXWV(TIME_SCALE))), INT2FIX(TIME_SCALE))`. It is the exact fractional second, so `(Time.at(0) + 0.1234560001).subsec` keeps the sub-nanosecond digits.

## Converged shape

`subsec` returns `new Rational(this.nsec, 1).add(this.#subnano).quo(1_000_000_000)`, collapsing to an Integer when the denominator is 1, as it does today.

## Acceptance criteria

- `subsec` includes the residual. A trails test adds `0.1234560001` to a Time and asserts `subsec` equals the exact Rational of that float's fraction.
