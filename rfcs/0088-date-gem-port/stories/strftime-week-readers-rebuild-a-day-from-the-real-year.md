---
title: "strftime's week readers rebuild a day from the real year, so %G/%V/%U are garbage past a Fixnum"
status: done
updated: 2026-08-13
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6473
claim: "2026-08-13T16:05:43Z"
assignee: "route-update-record-through-update-row"
blocked-by: null
closed-reason: null
---

## Context

`strftime`'s week-number readers go through `mLocalJd(subject)`
(`packages/date/src/date.ts`), which rebuilds a Julian day from the subject's
civil triple with `cCivilToJd(Number(subject.year), ...)`. Since PR #6297 the
subject's `year` is the REAL year — `m_real_year`, `nth` encoded back in
(`vendor/date/ext/date/date_core.c:1746-1762`) — so `Number()` on a huge one
both loses precision and feeds `c_civil_to_jd` a year it has no `int` for. Every
reader over it is then garbage:

```ruby
ruby -rdate -e 'p Date.jd(2**70).strftime("%G|%V|%U")'
#=> "3232350070754114273|02|01"
```

trails answers `"3232350070754114000|168655945816773030000|168655945816773030000"`.

MRI does not rebuild a day from the real year at all. `tmx_cwyear` reads
`m_real_cwyear` (`date_core.c:1859-1873`), which is `m_cwyear` — an `int`
computed from the RESIDUE day via `c_jd_to_commercial` — with `encode_year`
putting `nth` back afterwards, exactly as `m_real_year` does. `%V` / `%U` / `%W`
read `m_cweek` / `m_wnum0` / `m_wnum1` (`date_core.c:1876-1917`), which stay
`int`s over the residue day and never see `nth`.

## Converged shape

The strftime subject carries the residue day the readers are defined over
rather than re-deriving one from the real year: `StrftimeSubject` grows the
`m_local_jd` the receiver already has (`Date#mLocalJd`) plus its `nth`, the
`cwyear` reader becomes `m_real_cwyear` (`c_jd_to_commercial` over the residue
day, then `encodeYear`), and `cweek` / `wnum0` / `wnum1` take the residue day
straight. `mLocalJd(subject)`'s `cCivilToJd` rebuild — a trails-only seam — goes
away with it.

Note the Temporal-subject arm of `strftime` also fills these fields, and a
`Temporal` value is inside the residue range by construction, so it passes
`nth: 0n` and is unaffected.

## Acceptance criteria

- [ ] `Date.jd(2**70).strftime("%G|%V|%U")` is `"3232350070754114273|02|01"`,
      verified against a live `ruby -rdate -e`.
- [ ] `cwyear` is `m_real_cwyear`; `cweek` / `wnum0` / `wnum1` read the residue
      day, as the C's `int` readers do.
- [ ] No `cCivilToJd` rebuild from the subject's year remains in `strftime`.
- [ ] The existing `date.trails.test.ts` strftime cases pass unchanged.
