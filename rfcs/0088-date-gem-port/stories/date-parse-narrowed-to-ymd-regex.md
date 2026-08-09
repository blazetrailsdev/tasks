---
title: "Widen Date.parse beyond the y-m-d regex"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done on main: the narrow y-m-d regex parse in packages/activesupport/src/date.ts no longer exists — RFC 0088 moved ::Date to packages/date, and Date.parse (packages/date/src/date.ts:4008) now runs a full port of date_parse.c date__parse via Date._parse (date.ts:3948), covering every sub-parser (iso/eu/us/ddd/dot/sla/bc/vms/mdy). Acceptance criteria verified by packages/date/src/date.trails.test.ts:45-70: all conversions.rb doc spellings accepted (2012-12-13, Jul 2 2008, 2nd July 2008, 01/01/2012, 2008-7-2) and 12/13/2012 still raises ArgumentError 'invalid date'. 112/112 tests pass locally."
---

# Widen Date.parse beyond the y-m-d regex

## Context

`packages/activesupport/src/date.ts` (added by PR #6035) implements Ruby
stdlib `::Date` for callers that duck-type a Ruby date, notably
`I18n::Backend::Base#localize` (`i18n/lib/i18n/backend/base.rb:105-115`,
ported at `packages/i18n/src/backend/base.ts:245-271`).

Its `parse` accepts only `/^(-?\d{4,})-(\d{1,2})-(\d{1,2})$/` — enough for the
call sites that exist today (`activesupport/test/i18n_test.rb:9` passes
`"2008-7-2"`), and it raises `ArgumentError` with Ruby's `"invalid date"`
otherwise. Ruby's `Date.parse` accepts far more: `"2012-12-13"`,
`"Dec 13 2012"`, `"13th December 2012"`, RFC 2822, ISO 8601 ordinal and week
dates, and so on.

This matters beyond the class itself: `String#to_date` delegates straight to
`::Date.parse(self, false)`
(`activesupport/lib/active_support/core_ext/string/conversions.rb:47-48`), and
its documented examples include `"12/13/2012".to_date # => ArgumentError`,
which implies the parser both accepts more and rejects with the same error.
Any port of `to_date` onto this class inherits the narrowing.

## Converged shape

`Date.parse` handles the formats Ruby's does, or at minimum the set
`String#to_date` and its documented examples exercise, raising
`ArgumentError("invalid date")` for the rest — the message and the class are
already correct, only the accepted grammar is short.

Ruby's own parser is enormous; scope this to the formats trails call sites and
Rails' documented examples need, and record what is deliberately left out.

## Acceptance criteria

- `Date.parse` accepts the formats exercised by
  `core_ext/string/conversions.rb` and its doc examples.
- `"12/13/2012"` still raises `ArgumentError` with `"invalid date"`
  (conversions.rb:46).
- Coverage lands in `packages/activesupport/src/date.trails.test.ts`; Ruby's
  `::Date` is stdlib, so there is no Rails test to mirror.
