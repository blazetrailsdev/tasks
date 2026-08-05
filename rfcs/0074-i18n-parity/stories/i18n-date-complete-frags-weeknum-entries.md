---
title: "Carry rt_complete_frags' wnum0/wnum1 entries and rt__valid_date_frags_p's weeknum arms"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6104
claim: "2026-08-04T23:35:04Z"
assignee: "i18n-date-complete-frags-weeknum-entries"
blocked-by: null
closed-reason: null
---

## Context

`completeFrags` (`packages/i18n/src/date.ts`) now carries seven of
`rt_complete_frags`' eleven table entries (date-3.4.1
`ext/date/date_core.c:3884-3968`). The three that are not carried are the
week-numbered ones:

- `[:wnum0, [year, wnum0, wday, hour, min, sec]]`
- `[:wnum1, [year, wnum1, wday, hour, min, sec]]`
- `[nil,   [year, wnum0, cwday, hour, min, sec]]` and its `wnum1` twin

They are not inert. The entry with the most present fields wins, so a string
that names a `:year`, a `:wday` and a time gives the `wnum0` entry a count of
four and the civil entry a count of two — Ruby picks `wnum0`, completes
`wnum0 = 0`, and resolves through `rt__valid_date_frags_p`'s weeknum arm
(`date_core.c:4241-4258` and its `wnum1` twin, via `rt__valid_weeknum_p`).
trails, with those rows absent, falls through to the civil entry and answers a
1 January date instead. PR #6099 documented the omission at `completeFrags`
rather than closing it.

Closing it needs three pieces, which is why it was not folded into #6099:

1. `:wnum0`/`:wnum1` on `DateParts`/`DateFrag`, and the three table rows.
2. The two completion branches (`date_core.c:4062-4095`), including their
   `wnum ??= 0` / `wday ??= 0` and `wday ??= 1` defaults — note the branches
   read a `wnum0`/`wnum1` off `Date.today` that Ruby's `::Date` has no public
   reader for, so the today-fill loop needs the same values `d_lite_wnum0` /
   `d_lite_wnum1` compute.
3. `rt__valid_date_frags_p`'s two weeknum arms and `rt__valid_weeknum_p`
   (`date_core.c:4241-4275`), including the `cwday`-with-`7 → 0` fallback that
   mirrors the commercial arm's `wday`-with-`0 → 7` one.

## Converged shape

`completeFrags`' table is all eleven `rt_complete_frags` rows, and `Date.parse`
tries the weeknum arms in `rt__valid_date_frags_p`'s order — after commercial.

## Acceptance criteria

- The strings that select a `wnum` entry in ruby 3.3.11 / date 3.4.1 answer the
  same date through `Date.parse`, verified against the interpreter.
- No regression in the `date.trails.test.ts` battery, in particular the
  `a.length - e === 0` no-completion cases (`"wed 10:00:00"`).
- The "three `:wnum0`/`:wnum1` entries are not carried" paragraph at
  `completeFrags` is deleted, not reworded.
