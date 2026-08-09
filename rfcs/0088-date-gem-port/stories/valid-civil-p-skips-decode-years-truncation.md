---
title: "valid_civil_p skips decode_year's truncation, so a fractional year raises where MRI answers"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6297
claim: "2026-08-09T20:29:15Z"
assignee: "date-carries-no-nth-so-huge-years-lose-exactness"
blocked-by: null
closed-reason: null
---

## Context

MRI's `valid_civil_p` (`vendor/date/ext/date/date_core.c:2238-2264`) runs
`decode_year` (`:1342-1371`) before `c_valid_civil_p` on both of its style arms,
and the C's `c_valid_civil_p` (`:766-790`) takes an `int y`. `decode_year`
truncates: its Bignum arm ends at `FIX2INT(t) - 4712` over the 4712-SHIFTED
year, so a non-integer year is folded to an integer before any validation runs.

trails' `cValidCivilP` (`packages/date/src/date.ts`) takes `y: number` and
passes it straight to `cCivilToJd` / `cJdToCivil` with no truncation, so a
fractional year reaches the round trip and fails it:

```ruby
ruby -rdate -e 'p Date.new(-2000.5, 1, 1).to_s'   #=> "-2001-01-01"
ruby -rdate -e 'p Date.new(1600.5, 1, 1).to_s'    #=> "1600-01-01"
```

trails raises `Date::Error, "invalid date"` for the first and answers
`"1600-01-01"` for the second only by accident of the round trip.

Note the truncation is of the SHIFTED value, so it rounds toward -4712 rather
than toward zero: `-2000.5` decodes to `-2001`, not `-2000`.

Surfaced by PR #6290, which ported `guess_style` and both proleptic arms. That
PR ported `valid_gregorian_p` (`:2229-2236`) WITH the truncation — see
`validGregorianP` in `packages/date/src/date.ts`, whose doc states the rule —
so the Gregorian arm is already correct and only the `valid_civil_p` side is
left. This is a pre-existing gap the new branch made visible, not a regression:
before #6290 every year went through `cValidCivilP` and none of them truncated.

## Converged shape

Port `valid_civil_p` as its own function at the C's name, doing `decode_year`
(the shift / truncate / unshift, matching `validGregorianP`'s spelling in the
same file) and then handing the integer year to `cValidCivilP` — which keeps
taking an already-decoded `int y`, as the C's does. Both constructors' non-
proleptic arm and every other `cValidCivilP` caller route through it.

`decode_year`'s `nth` half stays out of scope here; it is tracked by
[[date-carries-no-nth-so-huge-years-lose-exactness]].

## Acceptance criteria

- [ ] `valid_civil_p` exists at its Rails name and is what the constructors'
      non-proleptic arm calls.
- [ ] `new Date(-2000.5, 1, 1).toS()` is `"-2001-01-01"` and
      `new Date(1600.5, 1, 1).toS()` is `"1600-01-01"`, verified against a live
      `ruby -rdate -e`.
- [ ] `cValidCivilP`'s own signature still documents that it takes a decoded
      integer year, as the C's does.
- [ ] The existing `date.trails.test.ts` cases pass unchanged.
