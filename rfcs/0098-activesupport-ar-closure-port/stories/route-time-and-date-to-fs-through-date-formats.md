---
title: "Route Time#to_fs and Date#to_fs through the DATE_FORMATS registry, deleting time-ext.ts's hand-rolled switch"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6645
claim: "2026-08-17T11:49:49Z"
assignee: "route-time-and-date-to-fs-through-date-formats"
blocked-by: null
closed-reason: null
---

## Context

`Time#to_fs` (`core_ext/time/conversions.rb:38-45`) and `Date#to_fs`
(`core_ext/date/conversions.rb:76-84`) both resolve through the
`Time::DATE_FORMATS` / `Date::DATE_FORMATS` hash:

```ruby
def to_fs(format = :default)
  if formatter = DATE_FORMATS[format]
    formatter.respond_to?(:call) ? formatter.call(self).to_s : strftime(formatter)
  else
    to_s
  end
end
```

PR #6635 ported the `Time::DATE_FORMATS` registry itself into
`packages/activesupport/src/time-ext.ts` and routed the DateTime arm's `to_fs`
(`core-ext/date-time/conversions.ts`) through it. `time-ext.ts`'s OWN `toFs`
was deliberately left alone and still answers a JS `Date` through a hand-rolled
`switch` over format names, inlining each entry's format string
(`packages/activesupport/src/time-ext.ts`, `export function toFs(date: Date,
format = "default")`). Its `case` arms do not even agree with the registry —
`long`/`short`/`rfc822` go through `toLocaleDateString`/`toUTCString` rather
than the `%B %d, %Y %H:%M` / `%d %b %H:%M` / `%a, %d %b %Y %H:%M:%S %z` the
registry now holds — so the two spellings of the same Rails method can disagree.

Because the DateTime arm is the only caller today, #6635 typed the registry's
four callables over the `Temporal.PlainDateTime | Temporal.ZonedDateTime` seat.
Rails' lambdas duck-type their argument (a `Time`, `Date` or `DateTime` all
answer `day`, `strftime`, `formatted_offset`, `rfc2822`, `iso8601`), so that
narrowing is part of the same debt.

This story is the sibling of `port-time-date-formats-registry`
(0023-surfaced-deviations), whose premise — "trails has no `DATE_FORMATS`
registry at all" — #6635 made stale; that story's remaining half is
`TimeWithZone#to_fs` (`time_with_zone.rb:212-220`,
`packages/activesupport/src/time-with-zone.ts`, another inlined switch).
Check it before starting so the two do not overlap.

## Converged shape

Delete `time-ext.ts`'s `toFs` switch and give it the Rails body above over
`DATE_FORMATS`, and widen the registry's callable parameter to the receiver
union the arms actually take. `Date::DATE_FORMATS`
(`core_ext/date/conversions.rb:8-16`) is a separate hash from `Time`'s and is
still unported — `Date#to_fs` reads THAT one, so porting it is part of this.

Rails anchors: `core_ext/time/conversions.rb:8-45`,
`core_ext/date/conversions.rb:8-16` and `:76-84`.

## Acceptance criteria

- [ ] `time-ext.ts`'s `toFs` is the Rails body over `DATE_FORMATS`, with no
      format-name `switch` left.
- [ ] `Date::DATE_FORMATS` is ported at its own spelling, and `Date#to_fs`
      reads it.
- [ ] The registry's callables take the receiver union Rails' lambdas
      duck-type, not the DateTime seat alone.
- [ ] The existing `toFs` callers (`core-ext/range/conversions.ts`'s `toFsDb`,
      `time-with-zone.ts`) still answer the same strings, or their tests are
      converged to Rails' if they were asserting the switch's output.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative;
      `parity:api:calls` / `:args` clean.
