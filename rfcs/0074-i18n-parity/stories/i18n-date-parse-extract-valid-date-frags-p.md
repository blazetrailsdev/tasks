---
title: "Extract rt__valid_date_frags_p from Date.parse's inlined frag check"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6102
claim: "2026-08-04T21:23:01Z"
assignee: "i18n-date-parse-extract-valid-date-frags-p"
blocked-by: null
closed-reason: null
---

## Context

Ruby decides whether a parsed frag Hash can become a Date in a **named
function**, `rt__valid_date_frags_p` (date-3.4.1/ext/date/date_core.c:4185-4220),
which `date_s_parse` calls after `date__parse`: it tries the ordinal date
(`:year` + `:yday`), then the civil one (`:year` + `:mon` + `:mday`), and
raises `Date::Error, "invalid date"` when neither is buildable.

`packages/i18n/src/date.ts` `Date.parse` inlines that decision into its own
body: a `try` around two `Temporal.PlainDate` constructions, with
`parts.year as number` casting away the case Ruby answers by _not_ finding a
`:year` at all. One Rails function is not one TS function here, and the cast
hides the missing-year arm behind a thrown constructor error.

Surfaced while converging `Date._parse` to answer a Hash always (PR #6087) —
with the `null` return gone, this inlined block is the only thing standing in
for `rt__valid_date_frags_p`.

## Converged shape

- Extract the decision as its own function named for the Ruby one, taking the
  frags and answering the built date or raising, with the same two branches in
  the same order (date_core.c:4185-4220).
- Test the `:year`-absent arm explicitly rather than reaching it through a
  constructor throw, so the cast can go.

## Acceptance criteria

- [ ] The frag-validity decision lives in one function mirroring
      `rt__valid_date_frags_p`'s branch order.
- [ ] No `as number` cast over an optionally-absent frag in `Date.parse`.
- [ ] No regression in the `date.trails.test.ts` battery.
