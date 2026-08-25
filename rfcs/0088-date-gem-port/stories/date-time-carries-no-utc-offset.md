---
title: '::DateTime hardcodes zone "+00:00", so %z always answers +0000'
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6151
claim: "2026-08-06T02:13:06Z"
assignee: "activemodel-types-construct-through-date-package"
blocked-by: null
closed-reason: null
---

## Context

trails' `::DateTime` cannot carry a non-UTC offset. `packages/date/src/date.ts:2840-2843`:

```ts
/** `DateTime#zone` is the UTC offset, where `Time#zone` is `"UTC"`. */
get zone(): string {
  return "+00:00";
}
```

The offset is a hardcoded constant, not state, so `DateTime#strftime`
(`date.ts:2856-...`) has nothing to pass and hands the formatter
`utcOffset: 0`. Every `%z` / `%:z` / `%::z` / `%:::z` on a `::DateTime` answers
`+0000` regardless of what the value was parsed from.

Ruby's `::DateTime` does carry one — it is one of the fields
`Date._parse` returns (`:offset`, `date_parse.c`'s `date_zone_to_diff`, already
ported at `date.ts` and recorded in `DateParts`), and `DateTime#zone` answers
the offset's spelling:

```ruby
DateTime.parse("2008-03-01T06:00:00+09:00").zone       # => "+09:00"
DateTime.parse("2008-03-01T06:00:00+09:00").strftime("%z")  # => "+0900"
```

So the parse side already recovers the offset and the formatter side already
accepts one as seconds; only `::DateTime`'s own state drops it in between.

Surfaced by PR #6147, which converted `StrftimeSubject`'s offset from a
pre-formatted `±HHMM` string to `utcOffset` seconds. That made the gap legible:
the `"+0000"` literal became a `0`, but it is still a constant.

## Converged shape

`::DateTime` holds the offset as state (seconds east of UTC, the same
representation `::Time` already uses at `date.ts`/`time.ts` — `Time` keeps a
number precisely because `Temporal`'s offset zones are minute-precision).
`#zone` spells it, `#strftime` passes it as `utcOffset`, and the `DateTime`
constructor plus `DateTime.parse` / `dNewByFrags` thread `:offset` through.

## Acceptance criteria

- [ ] `DateTime` carries an offset; `#zone` answers its spelling rather than a
      constant, and defaults to `"+00:00"` when the source named no zone.
- [ ] `DateTime.parse` with an offset round-trips it through `%z` and `%Z`.
- [ ] `#strftime` passes the real `utcOffset`; all four `%z` spellings answer
      from it (`date.ts` `formatOffset`).
- [ ] Verify against a live `ruby` — the gem is not vendored under
      `vendor/rails`, and `ruby` is on PATH.
