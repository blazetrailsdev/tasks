---
title: "DateTime's Temporal seat drops the parsed offset, half of RFC 0088's mapping"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6267
claim: "2026-08-09T00:45:54Z"
assignee: "date-state-julian-only-spellings-unbuildable"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `date-temporal-default-return-and-ruby-opt-in` (PR #6264).

RFC 0088's mapping table says a Ruby `DateTime` answers
**`Temporal.PlainDateTime` (+ offset where carried)**. Only the first half
landed. `DateTime#toDatetime` (`packages/date/src/date.ts`, the port of
`date_core.c` `datetime_to_datetime`, `date_core.c:9101-9105`) reads the local
civil date and time of day and drops `#of` entirely, so
`DateTime.parse("2008-03-01T06:00:00+09:00")` and
`DateTime.parse("2008-03-01T06:00:00")` answer the same `PlainDateTime`.

The offset is not lost from the port — it stays on the gem-shaped object
(`DateTime#offset` / `#zone`, both reachable through the opt-in
`dtNewByFrags(Date._parse(str))`), and PR #6264's tests exercise it there. What
is missing is the "+ offset where carried" half of the default return, so a
caller taking the default return silently loses the zone the string named.

The blocker PR #6264 documented at the call site: a `Temporal` offset time zone
is minute-precision, while `date_zone_to_diff` (`vendor/date/ext/date/date_parse.c:523-528`)
answers **seconds** — MRI's sub-minute offsets, the same ones
`packages/date/src/time.ts:26-28` keeps as a `number` for. So a blanket
`ZonedDateTime` return is not available.

## Converged shape

Answer a `Temporal.ZonedDateTime` (offset time zone, spelled by `of2str`) when
the parsed `of` is a whole number of minutes, and a `PlainDateTime` when it is
zero; decide and record what a sub-minute `of` does — the candidates are the
`PlainDateTime` fallback (lossy, needs saying so at the call site) or keeping
the seconds and rounding only the time-zone label. Reference `date_core.c`
`datetime_to_datetime` (`:9101-9105`) for what the value means, and
`of2str` (`date_core.c:1973-1980`) for the spelling.

Note `packages/date/src/date.ts`'s `temporalSubject` already reads a
`ZonedDateTime`'s real offset for `%z`/`%Z`/`%s`, so the formatter half needs no
change — this is only about what the statics answer.

## Acceptance criteria

- [ ] `DateTime.parse` / `DateTime.strptime` carry the parsed offset into the
      default return wherever `Temporal` can hold it.
- [ ] A sub-minute offset has a decided, documented behaviour, cited at the
      call site against `date_parse.c:523-528`.
- [ ] `packages/date/src/date.trails.test.ts` covers a zoned and an unzoned
      parse through the default return, not only through the gem-shaped opt-in.
- [ ] `pnpm parity:api:extra --package date` clean; no new baseline rows.
