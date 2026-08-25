---
title: "strftime is missing fourteen directive arms date_strftime.c has (%c %D %G %g %Q %R %r %T %U %W %V %v %X %+)"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6193
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`strftime` (`packages/date/src/date.ts`) recognises only the directives the i18n
format strings and the conformance mixins use; its JSDoc says so. Fourteen arms
`date_strftime.c` has are therefore missing and fall through to `unknown:`
verbatim:

| directive   | `date_strftime.c` | expansion                             |
| ----------- | ----------------- | ------------------------------------- |
| `%c`        | `:217-219`        | `STRFTIME("%a %b %e %H:%M:%S %Y")`    |
| `%D`        | `:221-223`        | `STRFTIME("%m/%d/%y")`                |
| `%G`        | `:235-247`        | `FMT('0', 0 <= y ? 4 : 5, cwyear)`    |
| `%g`        | `:249-253`        | `FMT('0', 2, mod(cwyear, 100))`       |
| `%Q`        | `:354-356`        | `FMTV('0', 1, tmx_msecs)`             |
| `%R`        | `:358-360`        | `STRFTIME("%H:%M")`                   |
| `%r`        | `:362-364`        | `STRFTIME("%I:%M:%S %p")`             |
| `%T`        | `:375-377`        | `STRFTIME("%H:%M:%S")`                |
| `%U` / `%W` | `:379-384`        | `FMT('0', 2, wnum0 / wnum1)`          |
| `%V`        | `:390-393`        | `FMT('0', 2, cweek)`                  |
| `%v`        | `:395-397`        | `STRFTIME("%e-%^b-%Y")`               |
| `%X`        | `:404-406`        | `STRFTIME("%H:%M:%S")`                |
| `%+`        | `:520-522`        | `STRFTIME("%a %b %e %H:%M:%S %Z %Y")` |

`%F` and `%x` already recurse through `strftime()` itself (PR #6178), so the
`STRFTIME` arms are a one-line each addition. The `FMT` arms need three fields
the subject does not carry yet — `cwyear`, `cweek`, `wnum0`/`wnum1` — which is
where the size is.

`%v` depends on `%^b`, so it wants
`strftime-case-flags-and-locale-extensions` first.

## Converged shape

`StrftimeSubject` grows `cwyear`, `cweek`, `wnum0` and `wnum1`, filled by
`Date`/`DateTime`/`Time`'s `strftime` from the commercial-date helpers already in
`date.ts`. Each arm above is added to the switch in `date_strftime.c`'s own
order, through `num()` / `text(strftime(subject, ...))` with the C's per-arm
defaults.

## Acceptance criteria

- [ ] All fourteen directives answer MRI's values, bare and width-qualified.
- [ ] Every directive's bare form is byte-identical to today.
- [ ] An unknown directive still falls through verbatim.
- [ ] Verify each value against a live `ruby -rdate -e`.

## Duplicate alert, 2026-08-07

`strftime-lacks-composite-conversions` was filed against this same gap from the
`strptime-sec-fraction-numerator-is-a-number` PR (#6192) **without checking this
RFC's story list first** — my mistake. It covers the `STRFTIME` recursion arms
(`%T` first, plus `%R`, `%r`, `%X`, `%c`, `%D`, `%v`) and nothing this table does
not already enumerate in more detail, with `date_strftime.c` line numbers this
one already has.

It was then claimed and is shipping as PR #6193, so it was **not** closed —
yanking an in-flight story out from under the agent holding it would orphan the
work. Triage should reconcile the two once #6193 lands: expect the `STRFTIME`
arms to be gone from this story's table by then, leaving the `FMT` arms
(`%G`, `%g`, `%U`/`%W`, `%V`, `%Q`) — the ones needing `cwyear` / `cweek` /
`wnum0` / `wnum1` on `StrftimeSubject`, which is where this story's size
actually lives.
