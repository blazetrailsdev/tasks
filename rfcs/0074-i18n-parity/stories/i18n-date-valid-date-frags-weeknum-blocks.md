---
title: "rt__valid_date_frags_p's :wnum0/:wnum1 blocks are not carried"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6104
claim: "2026-08-05T00:59:03Z"
assignee: "i18n-date-valid-date-frags-weeknum-blocks"
blocked-by: null
closed-reason: null
---

## Context

`rtValidDateFragsP` (`packages/i18n/src/date.ts`, added in #6102) carries four
of the six combinations `rt__valid_date_frags_p` tries
(date-3.4.1/ext/date/date_core.c:4185-4276): the `:jd`, the ordinal, the civil
and the commercial one. The two week-numbered blocks C tries last are not
carried:

- `:wnum0` + `:year` + a `wday` (`date_core.c:4240-4258`), whose `cwday`
  fallback maps a `cwday` of `7` back to `0`;
- `:wnum1` + `:year` + a `wday` (`date_core.c:4260-4276`).

They are absent because no ported sub-parser sets `:wnum0` or `:wnum1`, so
neither block can currently win — the omission is invisible today and becomes a
real gap the moment those keys start being set.

Sibling: `i18n-date-complete-frags-weeknum-entries` covers the matching
`rt_complete_frags` table entries. That story and this one touch the same
`date.ts` region; whichever lands second should absorb the other's diff rather
than fan out.

## Converged shape

- Port both blocks into `rtValidDateFragsP`, after the commercial one, in C's
  order and with C's `wday`/`cwday` fallback per block (note the two blocks map
  the fallback in OPPOSITE directions: `4225-4230` turns a `wday` of `0` into
  `7`, `4244-4249` turns a `cwday` of `7` into `0`).
- Port `valid_weeknum_p`'s arithmetic (`date_core.c` `c_valid_weeknum_p`) as the
  gate, answering `null` where Ruby answers `nil` so the search falls through.
- Drop the "not carried" paragraph from `rtValidDateFragsP`'s JSDoc once both
  blocks are there.

## Acceptance criteria

- [ ] Both week-numbered blocks present, in C's order, after the commercial one.
- [ ] Each block's `wday`/`cwday` fallback matches its own C direction.
- [ ] A frag Hash carrying `:wnum0`/`:wnum1` builds the date Ruby builds; an
      invalid one falls through rather than raising early.
