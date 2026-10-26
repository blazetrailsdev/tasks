---
title: "Time#strftime ports rb_strftime instead of reusing date_strftime"
status: in-progress
updated: 2026-10-26
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9344
claim: "2026-10-26T18:30:29Z"
assignee: "time-strftime-ports-rb-strftime"
blocked-by: null
closed-reason: null
---

## Context

`Time#strftime` (`packages/date/src/time.ts`, `strftime`) builds a
`StrftimeSubject` and calls Date's shared `strftime`
(`packages/date/src/date.ts:550`), which is the port of
`ext/date/date_strftime.c`. MRI's `Time#strftime` goes through a different
formatter, `rb_strftime` in `vendor/ruby/v3.3.11/strftime.c`. That formatter
reads the vtm directly:

- `%U` / `%W`: `weeknumber_v(vtm, 0|1)` (`strftime.c:507-517`, `:1114-1142`).
- `%V` / `%G`: `iso8601wknum_v` (`:725-745`, `:1105-1110`).
- `%s`: the time value itself, not a Julian day.

trails#9337 made the Julian-day path produce proleptic Gregorian answers by
passing `Date.GREGORIAN` as the subject's `sg`. Underneath, Time still borrows
the Date formatter where Ruby has its own.

## Acceptance criteria

- `Time#strftime` goes through a port of `rb_strftime` (`strftime.c`) under its
  MRI names, including `weeknumber_v` and `iso8601wknum_v`, and computes from
  the time's `yday` / `wday`.
- The Time-only `jd` / `sg` plumbing into Date's `StrftimeSubject` is removed.
- Existing `Time#strftime` tests, including "Time#strftime week numbers before
  the 1582 reform", stay green.
