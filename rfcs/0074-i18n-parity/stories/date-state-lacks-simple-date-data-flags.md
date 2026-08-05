---
title: "Date carries jd/sg where SimpleDateData carries a flags word, so HAVE_CIVIL-only is inexpressible"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6129
claim: "2026-08-05T15:01:05Z"
assignee: "vendor-ruby-date-gem"
blocked-by: null
closed-reason: null
---

## Context

ruby/date's `SimpleDateData` carries a `flags` word alongside its fields
(`date-3.4.1/ext/date/date_core.c:173-183`, at
`~/.asdf/installs/ruby/3.3.11/lib/ruby/gems/3.3.0/gems/date-3.4.1/ext/date/date_core.c`
— the gem is a default gem and is not vendored). `HAVE_JD`, `HAVE_DF`,
`HAVE_CIVIL` and `HAVE_TIME` say which representations have actually been
computed, and `m_canonicalize_jd` / the `get_s_*` accessors fill the rest in
lazily on first read.

trails' `Date` carries `#jd` and `#sg` only
(`packages/i18n/src/date.ts`), so every representation is eager. PR #6127
(`date-initialize-guess-style-fast-path`) hit this directly: `date_initialize`'s
negative-style arm stores `HAVE_CIVIL` alone and computes **no** Julian day
(`date_core.c:3533-3542`), and the port cannot express that — it computes the
Julian day on both arms and only the validation differs. That resolution is
documented at the constructor and is correct for the values produced, but it is
a state-shape deviation, not a converged port.

`Date.jd` has the mirror-image problem already noted in its own JSDoc: Ruby
writes the day straight into a fresh `SimpleDateData`, while the port rebuilds
it through the civil date it names because a TS class has one constructor.

## Converged shape

`Date`'s state answers "which representations are known" the way `flags` does,
so the `HAVE_CIVIL`-only arm of `date_initialize` stores the civil fields
without computing a Julian day, and `Date.jd` stores a Julian day without
round-tripping through civil.

Scope this deliberately: `flags` also drives `HAVE_DF`/`HAVE_TIME` on
`ComplexDateData`, which is `DateTime`'s territory. `HAVE_JD`/`HAVE_CIVIL` on
the simple date is the piece #6127 needed and is a coherent unit on its own.

## Acceptance criteria

- [ ] `Date` records which of jd/civil have been computed, mirroring
      `HAVE_JD` / `HAVE_CIVIL` (`date_core.c:173-183`).
- [ ] `date_initialize`'s negative-style arm computes no Julian day, as
      `date_core.c:3533-3542` does; the note at the trails constructor saying
      it does is deleted.
- [ ] `Date.jd` stores the day directly rather than rebuilding through civil.
- [ ] Values unchanged: re-run the 4536-construction differential against
      `ruby 3.3.11 -rdate` (18 years x 7 months x 9 days x 4 starts, spanning
      1581/1582/1583 and 1929/1930/1931 and both infinite starts) at zero
      mismatches.
