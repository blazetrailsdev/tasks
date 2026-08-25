---
title: "Converge Date.parse onto Ruby's spellings"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6056
claim: "2026-08-04T13:42:17Z"
assignee: "i18n-date-parse-accepts-only-y-m-d"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/date.ts:149-155` (`Date.parse`, landed by PR #6053) matches
only `/^(-?\d{4,})-(\d{1,2})-(\d{1,2})$/` and raises `ArgumentError("invalid
date")` on anything else. Ruby's `::Date.parse` (ruby/date, `date_parse.c`)
accepts a wide set of spellings — `"2008-07-02"`, `"Jul 2 2008"`,
`"2nd July 2008"`, `"20080702"` — and Rails leans on that breadth:
`String#to_date` delegates straight to it
(`activesupport/lib/active_support/core_ext/string/conversions.rb:47-48`), and
`Date.parse` is reachable from anything that round-trips a user-supplied date
string.

The narrowing was safe when the class was a test-only shim for
`I18n::Backend::Base#localize`'s duck type. It is riskier now that the class is
a shared `@blazetrails/i18n/date` export used by two packages.

Two further deviations sit in the same method, both noted at the call site:
`ArgumentError` stands in for Ruby's `Date::Error` (a class nested under
`Date`, which TS cannot spell as written), and the leading-zero tolerance is
deliberate because `activesupport/test/i18n_test.rb:9` passes `"2008-7-2"`.

## Converged shape

Either widen `Date.parse` to the spellings Rails actually round-trips, or —
if the narrow grammar is genuinely all trails needs — say so with a
`@noRailsEquivalent`-style receipt naming the Ruby method and what is dropped,
so the gap is measured rather than implicit. Prefer widening: silently
raising on a string Ruby parses is the failure mode that reaches users.

## Acceptance criteria

- `Date.parse` accepts, at minimum, the formats `String#to_date` callers in
  this repo pass, with a trails test per format in
  `packages/i18n/src/date.trails.test.ts`.
- An unparseable string still raises with Ruby's `"invalid date"` message.
- Any remaining narrowing is stated at the call site with the Ruby citation.
