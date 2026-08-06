---
title: "activemodel-types-construct-through-date-package"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: ["route-temporal-imports-activemodel-arel"]
deps-rfc: []
est-loc: 250
pr: 6151
claim: "2026-08-06T02:13:06Z"
assignee: "activemodel-types-construct-through-date-package"
blocked-by: null
closed-reason: null
---

## Context

**"Date functions flow through the date package, as in Rails" — the ActiveModel
type layer.**

Rails' `ActiveModel::Type::Date#cast_value` calls `::Date._parse` and
`::Date.new` — the gem's own entry points (`activemodel/lib/active_model/type/
date.rb`), and `Type::DateTime` likewise goes through `::Time`/`::DateTime`.
Trails' equivalents hand-roll their parsing instead:

- `packages/activemodel/src/type/date.ts:66` `fastStringToDate` (its own regex)
  and `:92` `fallbackStringToDate`
- `packages/activemodel/src/type/date-time.ts:181` (`PlainDateTime.from`) and
  `:278` `fallbackStringToTime`
- `packages/activemodel/src/type/time.ts`

So the `_parse` machinery RFC 0088 anchors — 1,566 lines of sub-parsers ported
from `date_parse.c`, the most-tested code in the cluster — is **not what
ActiveModel actually uses to parse a date attribute.** Two parsers, one measured,
one not.

Declared return types are already correct and must stay:
`DateCastResult = Temporal.PlainDate | …` (`type/date.ts:15`),
`DateTimeCastResult = Temporal.Instant | …` (`type/date-time.ts:18`). This story
changes _how the value is produced_, not what is produced.

**Care:** Rails' fast path exists for a reason — `cast_value` tries a cheap regex
before falling back to `_parse`. Keep that shape; the point is that the _fallback_
should be the gem's `_parse`, not a second hand-rolled parser.

## Acceptance criteria

- [ ] `fallbackStringToDate` / `fallbackStringToTime` route through
      `packages/date`'s `_parse` rather than their own parsing.
- [ ] The fast path stays a fast path — do not route every cast through `_parse`.
- [ ] Return types unchanged: `Temporal.PlainDate` / `Temporal.Instant`.
- [ ] JS `Date` remains an accepted _coercible input_ (`type/date.ts:41`,
      `type/date-time.ts:228`) — this story does not change input tolerance.
- [ ] Multiparameter assignment (`type/date.ts:38`) still works.
- [ ] Existing AM type tests pass unmodified; any newly-passing edge case (the
      gem's parser accepts more shapes) is noted in the PR body rather than
      hidden.
