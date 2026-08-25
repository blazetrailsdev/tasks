---
title: "The four valid_*_p wrappers are unported, so Date.ordinal/commercial/weeknum/nth_kday hardcode nth = 0"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6335
claim: "2026-08-10T13:33:27Z"
assignee: "date-parse-limit-kwarg-and-bignum-year"
blocked-by: null
closed-reason: null
---

## Context

`nth` now exists on `Date`/`DateTime` ([[date-carries-no-nth-so-huge-years-lose-exactness]],
PR #6297), but four builders still hardcode `0n` for it because only the
**int-level** `c_valid_*_p` helpers are ported, not the **VALUE-level**
`valid_*_p` wrappers that compute `nth`:

| Ruby (`vendor/date/ext/date/date_core.c`)                                        | trails (`packages/date/src/date.ts`) |
| -------------------------------------------------------------------------------- | ------------------------------------ |
| `valid_ordinal_p` (:2273-2303) over `c_valid_ordinal_p` (:868-890)               | only `cValidOrdinalP`                |
| `valid_commercial_p` (:2273-2303 sibling) over `c_valid_commercial_p` (:790-812) | only `cValidCommercialP`             |
| `valid_weeknum_p` (:2305-2333) over `c_valid_weeknum_p` (:815-838)               | only `cValidWeeknumP`                |
| `valid_nth_kday_p` (:2337-2365) over `c_valid_nth_kday_p` (:840-866)             | only `cValidNthKdayP`                |

Each wrapper branches on `guess_style(y, sg)`:

```c
if (style == 0) {
    r = c_valid_*_p(FIX2INT(y), ..., &jd, ns);
    if (!r) return 0;
    decode_jd(INT2FIX(jd), nth, rjd);
    if (f_zero_p(*nth)) *ry = FIX2INT(y);
    else { VALUE nth2; decode_year(y, *ns ? -1 : +1, &nth2, ry); }
} else {
    decode_year(y, style, nth, ry);
    r = c_valid_*_p(*ry, ..., rjd, ns);
}
```

`Date.ordinal` (`date.ts`, `date_s_ordinal` :3454-3505) and `Date.commercial`
(`date_s_commercial` :3606-3652) pass a literal `0n` into the
`d_simple_new_internal` seat, so a year past one `CM_PERIOD` silently reads
back wrong. `Date.weeknum` / `Date.nthKday` (added in #6331) run `decodeJd` on
the answer, which is the `style == 0` half of the wrapper but not the
`decode_year` half.

## Converged shape

Port the four `valid_*_p` wrappers with the Rails names — `validOrdinalP`,
`validCommercialP`, `validWeeknumP`, `validNthKdayP` — each answering
`[nth, ry, rjd]` where the C uses out-parameters, exactly as the already-ported
`validCivilP` / `validGregorianP` pair does. Then `Date.ordinal`,
`Date.commercial`, `Date.weeknum`, `Date.nthKday` and their `DateTime`
counterparts take `nth` from the wrapper instead of `0n` / `decodeJd`.

## Acceptance criteria

- [ ] `validOrdinalP` / `validCommercialP` / `validWeeknumP` / `validNthKdayP`
      exist with the C's `guess_style` branch and both of its `nth` arms.
- [ ] No builder passes a literal `0n` as `nth` to the seat.
- [ ] A trails-only test in `date.trails.test.ts` covers a year past one
      `CM_PERIOD` through `Date.ordinal` and `Date.commercial`, matching how
      #6297 covered `Date.civil`.
