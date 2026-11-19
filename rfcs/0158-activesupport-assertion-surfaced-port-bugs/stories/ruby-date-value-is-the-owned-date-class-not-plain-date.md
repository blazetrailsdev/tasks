---
title: "ruby-date-value-is-the-owned-date-class-not-plain-date"
status: draft
updated: 2026-11-19
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while sizing `date-parse-returns-temporal-not-the-owned-date-class`.
Ruby has a single `::Date` value. Every `::Date` builder answers one, and so
does every `to_date` (ruby/date `ext/date/date_core.c`; activesupport
`core_ext/string/conversions.rb:49-51`, `core_ext/time/calculations.rb`).

In trails the value is `Temporal.PlainDate`, used the same way everywhere:

- `packages/date/lib/date.ts:4747-4980`: `civil`, `jd`, `ordinal`,
  `commercial`, `today`, `strptime`, `parse`, `iso8601`, `rfc3339`,
  `xmlschema`, `rfc2822`, `rfc822`, `httpdate` and `jisx0301` all end in
  `.toDate()`.
- `Date#toDate` (`date.ts:5667`), `DateTime#toDate` (`:6642`), `Time#toDate`
  (`time.ts:1707`) and `TimeWithZone#toDate` (`time-with-zone.ts:415`) all
  answer `Temporal.PlainDate`.
- activesupport's Date core-ext uses `Temporal.PlainDate` as its receiver
  (139 type references under `packages/activesupport/lib`: `core-ext/date/*`,
  `date-and-time/calculations.ts`, `core-ext/string/conversions.ts:33`).

If only the `parse` family answers `Date`, the port ends up with two
`::Date` values side by side. `String#to_date` would then hand
`core-ext/date/calculations.ts` a receiver it does not accept. A trial edit
(dropping `.toDate()` from the parse family) caused type errors in
`core-ext/string/conversions.ts:34`, `test/i18n.test.ts:16` and 27 sites in
`date/test/date.trails.test.ts`, and that is before the downstream projects
are checked.

`DateTime` is already converged: `DateTime.parse` and its siblings answer
`DateTime` (`date.ts:6382-6435`). The `acts_like` markers already exist on
both classes (`activesupport/lib/core-ext/date/acts-like.ts`,
`core-ext/date-time/acts-like.ts`).

## Acceptance criteria

- [ ] Operator ruling: the port's `::Date` value is `@blazetrails/date`'s
      `Date` (with `Temporal` as its internal representation), not
      `Temporal.PlainDate`.
- [ ] Every `::Date` builder and every `to_date` answers `Date`, with no
      remaining `.toDate()` conversions to `PlainDate`.
- [ ] activesupport's Date core-ext receivers take `Date`. Sized per cluster
      (calculations, conversions, string conversions, json/xml-mini), with
      the clusters filed as separate stories if they exceed one PR.
- [ ] The `Temporal.PlainDate` seats in `packages/date/lib/acts-like.ts` and
      their `SCOPED_SKIP_GROUPS` text are retired.
