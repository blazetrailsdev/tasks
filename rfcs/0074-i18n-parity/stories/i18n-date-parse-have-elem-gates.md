---
title: "Port date__parse's per-sub-parser HAVE_ELEM_P gates"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6091
claim: "2026-08-04T20:44:04Z"
assignee: "i18n-date-parse-have-elem-gates"
blocked-by: null
closed-reason: null
---

## Context

`date__parse` gates each sub-parser call on the character classes its pattern
needs, recomputed on the live shared string
(`date-3.4.1/ext/date/date_parse.c:2172-2249`, `HAVE_ELEM_P` at `:2133`,
`check_class` at `:2111-2130`):

    if (HAVE_ELEM_P(HAVE_DIGIT|HAVE_DASH))       parse_iso    (:2186)
    if (HAVE_ELEM_P(HAVE_DIGIT|HAVE_DOT))        parse_jis    (:2189)
    if (HAVE_ELEM_P(HAVE_ALPHA|HAVE_DIGIT|HAVE_DASH)) parse_vms (:2192)
    if (HAVE_ELEM_P(HAVE_DIGIT|HAVE_SLASH))      parse_sla    (:2195)
    if (HAVE_ELEM_P(HAVE_DIGIT|HAVE_DOT))        parse_dot    (:2206)
    if (HAVE_ELEM_P(HAVE_DIGIT))                 parse_iso2   (:2217)
    if (HAVE_ELEM_P(HAVE_DIGIT))                 parse_year   (:2220)
    if (HAVE_ELEM_P(HAVE_ALPHA))                 parse_mon    (:2223)
    if (HAVE_ELEM_P(HAVE_DIGIT))                 parse_mday   (:2226)
    if (HAVE_ELEM_P(HAVE_DIGIT))                 parse_ddd    (:2229)

`packages/i18n/src/date.ts` `Date._parse` calls all ten unguarded, as one
`??` chain. Three of the gates ARE ported — `HAVE_ALPHA` before the eu/us
pair, and (PR #6085) `HAVE_ALPHA`/`HAVE_DIGIT` before `parse_bc`/`parse_frag`
— so the file is currently inconsistent with itself about whether the gate is
part of the port.

Not observable today: each gate demands exactly the characters its
sub-parser's own pattern already requires, so gate and pattern agree on every
input. It is a control-flow divergence rather than a behavior one — which is
why it is worth converging cheaply rather than leaving as a shape a reader
has to re-derive.

## Acceptance criteria

- Each of the ten calls above carries its `HAVE_ELEM_P` gate, in
  `date_parse.c:2186-2229`'s order, spelled the way the three already-ported
  gates are (a test on the live `str`, re-read after each `subx`).
- The gate reads the current `str`, not the `_parse` argument — `check_class`
  runs on the shared string every sub-parser has been editing
  (`date_parse.c:2133`).
- `HAVE_ALPHA` is `isalpha` and `HAVE_DIGIT` is `isdigit` — ASCII, matching
  `date_parse.c:2118-2121`.
- No behavior change: the existing `date.trails.test.ts` battery passes
  unchanged.
