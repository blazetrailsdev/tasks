---
title: "i18n-date-parse-eu-us-gate-misses-have-digit"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6093
claim: "2026-08-04T21:11:10Z"
assignee: "i18n-date-parse-eu-us-gate-misses-have-digit"
blocked-by: null
closed-reason: null
---

## Context

`date__parse` gates the `parse_eu`/`parse_us` pair on
`HAVE_ELEM_P(HAVE_ALPHA | HAVE_DIGIT)` (`date-3.4.1/ext/date/date_parse.c:2180`)
— both character classes must be present on the live `str`:

    if (HAVE_ELEM_P(HAVE_ALPHA | HAVE_DIGIT)) {
        if (parse_eu(str, hash))
            goto ok;
        if (parse_us(str, hash))
            goto ok;
    }

`packages/i18n/src/date.ts` `Date._parse` gates it on `HAVE_ALPHA` alone:

    if (/[a-z]/i.test(str)) {
      rest = parseEu(str, hash) ?? parseUs(str, hash);
    }

So a digitless string ("Feb", "Sunday Monday") calls `parseEu` and `parseUs`
where Rails skips both. Both patterns require a digit run of their own
(`parse_eu` `:869-916`, `parse_us` `:951-996`), so no input is known to differ
today — as with the ten gates converged by #6091, this is a control-flow
divergence, not an observable one.

Surfaced in review on #6091 (`i18n-date-parse-have-elem-gates`), which ported
`date_parse.c:2186-2229`'s ten gates and left this pre-existing one, at
`:2180`, outside its stated scope.

## Acceptance criteria

- The eu/us gate at `packages/i18n/src/date.ts` `Date._parse` tests for a digit
  as well as an alphabetic character, spelled the way the ten gates beside it
  are (`/[a-z]/i.test(str) && /\d/.test(str)`), citing `date_parse.c:2180`.
- The gate reads the live `str` — the string `parse_day` and `parse_time` have
  already `subx`ed — not the `_parse` argument.
- `packages/i18n/src/date.trails.test.ts` passes unchanged.
