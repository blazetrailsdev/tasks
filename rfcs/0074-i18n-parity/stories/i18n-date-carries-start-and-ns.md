---
title: "Carry ruby/date's start and ns state on Date, so Date#start and the new_start family can be ported"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: 6123
claim: "2026-08-05T11:44:59Z"
assignee: "i18n-date-carries-start-and-ns"
blocked-by: null
closed-reason: null
---

## Context

PR #6111 threaded ruby/date's calendar-reform start `sg` through the whole
`c_*` family in `packages/i18n/src/date.ts`, but dropped every function's `*ns`
out-param — the flag saying which side of the reform the resulting Julian day
landed on.

In date-3.4.1 (`ext/date/date_core.c`, read at
`~/.asdf/installs/ruby/3.3.11/lib/ruby/gems/3.3.0/gems/date-3.4.1/ext/date/date_core.c`;
the gem is NOT vendored, `gem contents date` prints nothing because it is a
default gem) `*ns` is set by every builder:

- `c_civil_to_jd` (`date_core.c:503-524`) — `*ns = (jd < sg) ? 0 : 1`
- `c_ordinal_to_jd` (`date_core.c:557-564`), `c_commercial_to_jd`
  (`date_core.c:577-589`), `c_weeknum_to_jd` (`date_core.c:611-620`) — same
- and it is carried out through `c_valid_civil_p` (`date_core.c:767-790`),
  `c_valid_ordinal_p` (675-695), `c_valid_commercial_p` (792-813) and
  `c_valid_weeknum_p` (816-837) into `d_simple_new_internal`.

It is dropped because the ported `Date` carries no `sg`/`ns` state of its own:
the class holds a bare `Temporal.PlainDate`, so there is nowhere to put it and
nothing that reads it. The omission is documented at `cCivilToJd`'s call site
in `packages/i18n/src/date.ts`.

The observable consequence is that `Date#start`, `Date#julian?`,
`Date#gregorian?`, `Date#new_start`, `Date#italy`, `Date#england`,
`Date#julian` and `Date#gregorian` (`date_core.c` `d_lite_start` and the
`d_lite_new_start` family) cannot be ported at all. `Date.parse(str, comp,
start)` currently resolves the date under `start` and then throws `start` away,
so the answer's own start is silently `Date::ITALY` whatever was asked for.

## Converged shape

`Date` carries its start and its `ns` flag the way `date_core.c`'s
`SimpleDateData` does (`nth`, `jd`, `sg`, `flags`), the `c_*` builders answer
their `*ns` alongside the Julian day, and the `d_lite_start` /
`d_lite_new_start` readers are ported on top.

Note this likely wants the `Date` instance to hold a Julian day plus `sg`
rather than a `Temporal.PlainDate`, since a Julian-calendar date such as
1500-02-29 is not constructible as a `Temporal.PlainDate` (proleptic Gregorian,
where 1500 is not a leap year) — that is the language-level reason the port
went `Temporal`-first, and converging the state is what removes it.

## Acceptance criteria

- [ ] The `c_*` builders answer `ns` as ruby/date does, and the `c_valid_*_p`
      family carries it out.
- [ ] `Date` carries `sg`, so `Date.parse("1582-10-10", true,
Date::GREGORIAN).start` is `Date::GREGORIAN`, not `Date::ITALY`.
- [ ] `Date#start` / `#julian?` / `#gregorian?` / `#new_start` / `#italy` /
      `#england` / `#julian` / `#gregorian` are ported.
- [ ] `Date.jd(2299160).to_s` and `Date.parse("1500-02-29", true,
Date::JULIAN)` agree with ruby 3.3.11.
- [ ] The `*ns` deviation note at `cCivilToJd`'s call site is deleted.
