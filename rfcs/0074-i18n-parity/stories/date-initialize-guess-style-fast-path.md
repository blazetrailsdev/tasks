---
title: "Date's constructor drops date_initialize's guess_style / valid_gregorian_p arm"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6127
claim: "2026-08-05T13:14:58Z"
assignee: "date-initialize-guess-style-fast-path"
blocked-by: null
closed-reason: null
---

## Context

`Date`'s constructor (`packages/i18n/src/date.ts`) is the port of ruby/date's
`date_initialize` (`date-3.4.1/ext/date/date_core.c:3503-3557`, read at
`~/.asdf/installs/ruby/3.3.11/lib/ruby/gems/3.3.0/gems/date-3.4.1/ext/date/date_core.c`
— the gem is a default gem, so it is not vendored and `gem contents date`
prints nothing).

`date_initialize` branches on `guess_style(y, sg)` (`date_core.c:1414-1432`)
before it validates anything:

- `guess_style` answers a non-zero style when the reform cannot possibly bite —
  an infinite `sg`, a bignum `y`, or a `y` outside `REFORM_BEGIN_YEAR ..
REFORM_END_YEAR`.
- On a negative style (`date_core.c:3533-3542`) it validates with
  `valid_gregorian_p` and stores `HAVE_CIVIL` only — no Julian day is computed
  at all.
- Otherwise (`date_core.c:3543-3554`) it goes through `valid_civil_p` and stores
  `HAVE_JD | HAVE_CIVIL`.

The port has only the second arm: every construction runs `c_valid_civil_p`.

This predates PR #6123 — it came in with #6111's `sg` threading — but nothing
tracks it, and #6123's reviewer surfaced it while walking the constructor.

## Converged shape

`Date`'s constructor branches on a ported `guessStyle`, taking the
`valid_gregorian_p` arm when the reform cannot bite.

Note the port carries `jd`/`sg` where ruby/date carries a `flags` word, so the
`HAVE_CIVIL`-only arm has no direct counterpart in the current state — landing
this likely means the state has to answer "civil known, Julian day not computed
yet" the way `SimpleDateData`'s `flags` does (`date_core.c:173-183`), or the arm
collapses to computing the Julian day anyway and only the validation differs.
Decide that in the story rather than assuming.

## Acceptance criteria

- [ ] `guess_style` (`date_core.c:1414-1432`) is ported, with its three arms.
- [ ] `Date`'s constructor takes the `valid_gregorian_p` arm when
      `guessStyle` is negative, as `date_initialize:3533-3542` does.
- [ ] Constructions either side of `REFORM_BEGIN_YEAR`/`REFORM_END_YEAR`, and
      with an infinite `start`, agree with `ruby 3.3.11 -rdate`.
