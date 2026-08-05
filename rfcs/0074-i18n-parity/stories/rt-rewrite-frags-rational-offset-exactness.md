---
title: "rt_rewrite_frags takes a Rational offset's value instead of carrying it exactly"
status: draft
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rtRewriteFrags` (`packages/i18n/src/date.ts`, ported in #6112 from date-3.4.1
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
