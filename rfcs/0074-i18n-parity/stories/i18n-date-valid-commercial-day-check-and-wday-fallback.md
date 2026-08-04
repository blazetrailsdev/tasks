---
title: "Carry c_valid_commercial_p's day check and the commercial arm's wday fallback"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 6099
claim: "2026-08-04T22:47:02Z"
assignee: "i18n-date-complete-frags-wday-element"
blocked-by: null
closed-reason: null
---

# Carry c_valid_commercial_p's day check, and the commercial arm's wday fallback

## Context

PR #6088 added `Date.parse`'s commercial arm (`packages/i18n/src/date.ts`,
`Date.parse`). Two lines of the Ruby it stands in for are not transcribed:

1. **The day check.** `c_valid_commercial_p`
   (date-3.4.1 `ext/date/date_core.c:792-810`) rebuilds the commercial date from
   the JD it computed and rejects on `y != *ry || w != *rw || d != *rd`. The
   port checks only `d.yearOfWeek !== parts.cwyear || d.weekOfYear !== parts.cweek`
   — the day comparison is missing. It is currently unobservable (the ported
   `parse_iso21`/`parse_iso22`, `date_parse.c:1035-1099`, can only produce
   `cwday` 1-7, and an out-of-range one lands in an adjacent ISO week the
   week/year check already rejects), but it is a dropped guard, not a
   simplification anyone reasoned about at the Ruby.
2. **The `wday` fallback.** `rt__valid_date_frags_p`'s commercial arm
   (`date_core.c:4220-4239`) reads `:cwday`, and when it is absent falls back to
   `:wday`, mapping `0` to `7`. The port reads `:cwday` only. This becomes
   observable the moment `i18n-date-parse-day-sets-wday` lands `:wday`.

## Converged shape

- Compare the reconstructed `dayOfWeek` alongside `yearOfWeek`/`weekOfYear`.
- Add the `:wday`-with-`0 → 7` fallback ahead of the `cwday` read, in
  `rt__valid_date_frags_p`'s order.
- Land this on top of `i18n-date-parse-extract-valid-date-frags-p` (already
  claimed) if that ships first — the two arms belong in the extracted function,
  not inlined in `Date.parse`.

## Acceptance criteria

- `Date.parse` rejects a commercial date whose day does not round-trip, and
  accepts `:wday` where Ruby does, both agreeing with the interpreter.
- Regression coverage in `date.trails.test.ts` that fails on today's baseline.
