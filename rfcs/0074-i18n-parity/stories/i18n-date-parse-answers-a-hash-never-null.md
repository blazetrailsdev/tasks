---
title: "Date._parse answers a Hash always, as date__parse does"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6087
claim: "2026-08-04T20:20:03Z"
assignee: "i18n-date-parse-answers-a-hash-never-null"
blocked-by: null
closed-reason: null
---

## Context

`date__parse` (`date-3.4.1/ext/date/date_parse.c:2166-2294`) builds one Hash up
front and always answers it, empty or not:

```text
Date._parse("1 BCE")       #=> {}
Date._parse("not a date")  #=> {}
```

`packages/i18n/src/date.ts` `Date._parse` answers `null` instead when no
sub-parser filled anything:

```ts
if (parts === null && Object.keys(hash).length === 0) return null;
```

and `Date.parse` reads that `null` as its "invalid date" signal
(`date.ts` `parse`). Ruby gets the same outcome from
`rt__valid_date_frags_p` (`date_core.c:4185-4220`) finding no buildable
combination in the empty Hash, not from a distinguished return value.

`Date._parse` is public — `String#to_date` reaches it through
`::Date.parse(self, false)`
(activesupport/lib/active_support/core_ext/string/conversions.rb:47-48) — so a
caller that inspects the Hash sees `null` where Rails sees `{}`, and the
declared return type carries a `null` Ruby never produces.

## Converged shape

- `Date._parse` answers a `DateParts` always, never `null`, as `date__parse`
  does.
- `Date.parse` decides on the fields present, the way `rt__valid_date_frags_p`
  does: it already raises `Date::Error("invalid date")` when it cannot build
  from `:year`+`:yday` or `:year`+`:mon`+`:mday`, so the `null` check in front
  of `completeFrags` goes away rather than moving.

## Acceptance criteria

- `Date._parse("not a date")` and `Date._parse("1 BCE")` answer `{}`.
- `Date.parse` still raises `Date::Error("invalid date")` for both.
- No regression in the `date.trails.test.ts` battery.
