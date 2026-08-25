---
title: "Date#yday ports only m_yday's third branch, dropping both civil-field fast arms"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6138
claim: "2026-08-05T17:13:08Z"
assignee: "date-yday-drops-m-yday-fast-arms"
blocked-by: null
closed-reason: null
---

## Context

ruby/date's `m_yday` is not a straight ordinal conversion — it branches first
(`vendor/date/ext/date/date_core.c:1823-1841`):

    static int
    m_yday(union DateData *x)
    {
        jd = m_local_jd(x);
        sg = m_virtual_sg(x); /* !=m_sg() */

        if (m_proleptic_gregorian_p(x) || (jd - sg) > 366)
            return c_gregorian_to_yday(m_year(x), m_mon(x), m_mday(x));
        if (m_proleptic_julian_p(x))
            return c_julian_to_yday(m_year(x), m_mon(x), m_mday(x));
        c_jd_to_ordinal(jd, sg, &ry, &rd);
        return rd;
    }

The two fast arms compute the day-of-year from the _civil_ fields, so on a
`HAVE_CIVIL`-only date they never touch the Julian day. trails'
`get yday()` (`packages/i18n/src/date.ts`) ports only the third arm —
`cJdToOrdinal(this.#mJd(), this.#sg)![1]` — which forces `#getSJd()` and drops
both the `m_proleptic_gregorian_p` / `(jd - sg) > 366` and
`m_proleptic_julian_p` branches along with the `c_gregorian_to_yday` /
`c_julian_to_yday` helpers they call.

Surfaced while shipping `date-state-lacks-simple-date-data-flags` (PR #6129),
which landed the `HAVE_JD`/`HAVE_CIVIL` flags the fast arms exist to exploit.
Values agree today (verified by a 4536-construction differential against
`ruby 3.3.11 -rdate`), so this is a control-flow and laziness divergence rather
than a wrong answer.

## Converged shape

`yday` mirrors `m_yday`'s three branches in order, with
`cGregorianToYday` / `cJulianToYday` ported at their Rails names
(`date_core.c` `c_gregorian_to_yday`, `c_julian_to_yday`), plus the
`m_proleptic_gregorian_p` / `m_proleptic_julian_p` predicates the guards read.

## Acceptance criteria

- [ ] `yday` branches as `m_yday` does (`date_core.c:1823-1841`), in the same
      order, with the same guards.
- [ ] `c_gregorian_to_yday` / `c_julian_to_yday` and the two proleptic
      predicates are ported at their Rails names.
- [ ] A `HAVE_CIVIL`-only date answers `yday` without computing a Julian day.
- [ ] The construction differential against `ruby 3.3.11 -rdate` stays at zero
      mismatches.
