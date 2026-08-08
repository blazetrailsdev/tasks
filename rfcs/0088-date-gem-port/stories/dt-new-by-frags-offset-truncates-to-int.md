---
title: "dt_new_by_frags' offset is an int via NUM2INT; trails keeps a float Rational quotient"
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
pr: 6251
claim: "2026-08-08T17:51:58Z"
assignee: "dt-new-by-frags-offset-truncates-to-int"
blocked-by: null
closed-reason: null
---

## Context

`dt_new_by_frags` reads the parsed `:offset` fragment with `NUM2INT`
(`vendor/date/ext/date/date_core.c:8297-8306`):

```c
t = ref_hash("offset");
if (NIL_P(t))
    of = 0;
else {
    of = NUM2INT(t);
    if (of < -DAY_IN_SECONDS || of > DAY_IN_SECONDS) {
        of = 0;
        rb_warning("invalid offset is ignored");
    }
}
```

`of` is a C `int`, so `NUM2INT` truncates a Rational fragment toward zero.
`date_zone_to_diff` answers a `Rational` for a fractional-hour offset of more
than two decimal places (`date_parse.c:523-528`), so this path is live.

trails' `dtNewByFrags` (`packages/date/src/date.ts`) instead divides the
Rational into a float:

```ts
let of = t == null ? 0 : t instanceof Rational ? t.numerator / t.denominator : t;
```

so `of` stays fractional where C holds an int. Verified on ruby 3.3.11 vs
trails at merge of PR #6172:

```ruby
Date._parse("2008-03-01T06:00:00+9.5555")[:offset]  #=> (171999/5)   both agree
DateTime.parse("2008-03-01T06:00:00+9.5555").offset
  ruby   #=> (34399/86400)                    # of = 34399, an int
  trails #=> 2363936255823053/5937362789990400 # of = 34399.8, a float
```

`zone` agrees (`"+09:33"`) because `of2str` only formats hours and minutes, so
the divergence is invisible there and only surfaces through `#offset`. The
un-reduced denominator is the giveaway: every `Rational` derived from `of`
downstream inherits the float.

## Converged shape

Truncate toward zero at the `NUM2INT` seam, as the C's `int` does — the
Rational fragment becomes an integer number of seconds before the
`±DAY_IN_SECONDS` bound is applied, so the bound is checked against the same
value Ruby checks. Note this is truncation, NOT the round-half-away-from-zero
`round()` helper `offsetToSec` uses: `NUM2INT` truncates, and 34399.8 must
become 34399, not 34400.

`offsetToSec` / `val2off` (landed in PR #6172) are a different seam and are
already correct — `dt_new_by_frags` deliberately does not go through them.

## Acceptance criteria

- [ ] `dtNewByFrags` holds `of` as an integer number of seconds, truncated
      toward zero from a `Rational` fragment.
- [ ] `DateTime.parse("2008-03-01T06:00:00+9.5555").offset` is `(34399/86400)`.
- [ ] The `±DAY_IN_SECONDS` bound is applied to the truncated value.
- [ ] A pin covers a fractional-hour zone whose `date_zone_to_diff` answer is a
      `Rational` that does not reduce to an integer.
