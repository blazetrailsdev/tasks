---
title: "Date/DateTime carry no nth, so years past MAX_SAFE_INTEGER lose exactness"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6297
claim: "2026-08-09T20:29:15Z"
assignee: "date-carries-no-nth-so-huge-years-lose-exactness"
blocked-by: null
closed-reason: null
---

## Context

`Date`/`DateTime` carry the Julian day and the year as plain JS numbers, so
both run out of exactness at `Number.MAX_SAFE_INTEGER`. MRI keeps them exact at
any magnitude by splitting the value into `nth` plus a residue:
`decode_year` (`vendor/date/ext/date/date_core.c:1342-1371`) divides the
4712-shifted year by `CM_PERIOD_GCY` / `CM_PERIOD_JCY` (`:204-205`),
`encode_year` (`:1373-1390`) puts it back, and `decode_jd` / `encode_jd`
(`:1393-1412`) do the same for the day over `CM_PERIOD` (`:203`). `nth` is a
field of both `SimpleDateData` and `ComplexDateData` (`:203-231`).

So MRI answers:

```ruby
ruby -rdate -e 'p Date.new(2**70, 1, 1).to_s'   #=> "1180591620717411303424-01-01"
```

trails answers `"1.1805916207174113e+21-01-01"` — the year survives as a double
but no longer as an integer, and `%Y` formats it in exponential notation.

PR #6290 (which seated `guess_style` and the proleptic arms) documented this as
the known range limit rather than closing it: see the `guessStyle` doc in
`packages/date/src/date.ts`, which states the limit is roughly year ±2.4e10 and
that precision, not range, is what runs out above it. `validGregorianP` in the
same file notes `decode_year` reduces to its truncation because `nth` is always
zero below that bound.

Nothing below the bound is affected — `Date.new(600000,1,1).jd` is `220866560`
in both — so this is a reachability gap, not a wrong answer in the common range.

## Converged shape

Carry `nth` (and the matching Julian-day high half) on `Date`'s and
`DateTime`'s state, with `decode_year` / `encode_year` / `decode_jd` /
`encode_jd` ported at their C names, so a year outside the double's integer
range round-trips as MRI's does. `bigint` is the likely substrate for the high
half; the low half stays a number so the hot path is unchanged.

The alternative — raising a clear `Date::Error` at the bound instead of
answering an exponential-notation year — is a strictly smaller change and is
acceptable as a first step, but it is not convergence: MRI has no such bound.

## Acceptance criteria

- [ ] `decode_year`, `encode_year`, `decode_jd` and `encode_jd` exist at their
      C names and are what the constructors and the civil/JD decode go through.
- [ ] `Date.new(2**70, 1, 1).to_s` is `"1180591620717411303424-01-01"`, verified
      against a live `ruby -rdate -e`.
- [ ] Values inside the current range are unchanged (the existing
      `date.trails.test.ts` cases still pass untouched).
- [ ] The range-limit prose in `guessStyle`'s doc is deleted, not reworded.
