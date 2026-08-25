---
title: "date-seat-drops-nth-and-spells-the-residue-year"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6338
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Date#toDate` (`packages/date/src/date.ts`) is
`plainDateFromJd(this.mLocalJd(), sg)`, and `mLocalJd` answers the RESIDUE
Julian day — the `nth` `decode_jd` split off (`date_core.c:1393-1402`) is
dropped on the floor. So every static that answers the `Temporal.PlainDate`
seat silently spells the residue year for a date past one `CM_PERIOD`:

```text
Date.civil(600000, 2, 29)      -> "+015600-02-29"   (MRI: "600000-02-29")
Date.ordinal(600000, 60)       -> "+015600-02-29"
Date.commercial(600000, 9, 6)  -> "+015600-03-04"
Date.weeknum(600000, 9, 6)     -> "+015600-03-04"
```

The gem-shaped object underneath is correct — `dNewByFrags({ year: 600000,
yday: 60 })` answers `600000-02-29` / jd `220866619`, matching MRI — so this is
purely the seat conversion. `Date#jd` (`date.ts`, `d_lite_jd`) does the right
thing: it `encodeJd(this.nth, this.mLocalJd())`.

`Temporal.PlainDate` tops out at ±271821, so the correct answer for a year past
`CM_PERIOD_GCY` (584388) is usually "no `Temporal` value exists" — i.e. the
`Date::Error, "invalid date"` `plainDateFromJd` already raises for a Julian-only
day. Silently answering a DIFFERENT, valid-looking date is the bug.

Found while porting the four `valid_*_p` wrappers (PR for
[[port-valid-p-wrappers-so-builders-stop-hardcoding-nth]]): before that PR
`Date.ordinal`/`Date.commercial` hardcoded `nth = 0` and so handed the seat the
whole Julian day, which raised; now they carry the real `nth` and match
`Date.civil` / `Date.weeknum`'s residue reading. The three-way agreement is the
right outcome; the shared answer is the wrong one.

## Acceptance criteria

- [ ] `plainDateFromJd` (or its callers) reads the day `encodeJd(nth, rjd)`
      names, not the residue, so a nonzero `nth` cannot be silently discarded.
- [ ] `Date.civil(600000, 2, 29)`, `Date.ordinal(600000, 60)`,
      `Date.commercial(600000, 9, 6)` and `Date.weeknum(600000, 9, 6)` raise
      `Date::Error, "invalid date"` from the seat rather than answering a
      residue-year date, matching the existing
      "raises from the seat for a day past Temporal's range" test in
      `date.trails.test.ts`.
- [ ] The gem-shaped path (`dNewByFrags`) keeps answering MRI's whole date.
