---
title: "rt_rewrite_frags takes a Rational offset's value instead of carrying it exactly"
status: done
updated: 2026-08-07
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6176
claim: "2026-08-07T15:54:17Z"
assignee: "i18n-load-yml-json-take-the-psych4-arm"
blocked-by: null
closed-reason: null
---

## Context

`rtRewriteFrags` (`packages/date/src/date.ts:1709` — the file moved out of `packages/i18n`
with PR #6144; ported in #6112 from date-3.4.1
`ext/date/date_core.c:3839-3872`) folds an `:offset` into `:seconds` before
splitting out the time of day:

```c
    offset = ref_hash("offset");
    if (!NIL_P(offset))
    seconds = f_add(seconds, offset);
```

Ruby's `f_add` keeps a `Rational` offset exact, so the fraction survives all the
way into `:sec_fraction`. The port takes the Rational's value instead:

```ts
s0 += offset instanceof Rational ? offset.numerator / offset.denominator : offset;
```

That is a documented deviation at the call site, but it is still a deviation: a
fractional-hour zone with more than two decimal places — the case
`dateZoneToDiff` answers a `Rational` for, see the done story
`i18n-date-zone-to-diff-rational-offset` — loses exactness in the resulting
`:sec_fraction`.

Re-verified 2026-08-07 on origin/main (311bff350): the value-taking line
survives #6153's re-seating of `Date` on `Temporal.PlainDate`, at
`packages/date/src/date.ts:1716`.

`Rational` already lives in `date.ts` (`rational.c` `nurat_add` is ported as
`Rational#add`), so the arithmetic exists; only the division-and-modulo chain
(`f_idiv` / `f_mod` over `DAY_IN_SECONDS`, `HOUR_IN_SECONDS`,
`MINUTE_IN_SECONDS`, then `1`) is number-only.

## Converged shape

`rtRewriteFrags` carries a `Rational` `:seconds` through `f_idiv`/`f_mod` the
way Ruby does, so `:sec_fraction` is exact for a Rational offset.

## Acceptance criteria

- [ ] A `Rational` `:offset` produces the `:sec_fraction` ruby 3.3.11 produces,
      verified against the interpreter.
- [ ] The integer path is unchanged.
- [ ] The value-taking note in `rtRewriteFrags`' JSDoc is deleted, not reworded.
