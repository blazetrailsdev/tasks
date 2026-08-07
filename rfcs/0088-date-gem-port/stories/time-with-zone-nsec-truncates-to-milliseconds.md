---
title: "TimeWithZone#nsec/#usec truncate to milliseconds, so %N can never answer nine digits"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6158
claim: "2026-08-06T15:23:07Z"
assignee: "time-with-zone-nsec-truncates-to-milliseconds"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::TimeWithZone#nsec` truncates to millisecond precision, so the
`%N` and `%L` strftime directives — and `usec` / `nsec` themselves — can never
answer more than three significant digits.

`packages/activesupport/src/time-with-zone.ts:236-238`:

```ts
/** Nanoseconds (milliseconds * 1_000_000) */
get nsec(): number {
  return this.msec * 1_000_000;
}
```

`usec` (`time-with-zone.ts:231-233`) is the same shape, and `_local()`
(`time-with-zone.ts:190-...`) only ever exposes `millisecond`.

The comment on `usec` claims "JS doesn't have sub-ms precision", which is no
longer true and is the reason to converge: the receiver's `_zoned` is a
`Temporal.ZonedDateTime`, which carries real nanoseconds
(`nanosecond`, `microsecond`, `epochNanoseconds`). The precision is already in
the object and is being discarded on the way out.

In Rails, `TimeWithZone#nsec` is not defined at all — `method_missing` sends it
to the underlying `Time` (`activesupport/lib/active_support/time_with_zone.rb:557-566`),
and `Time#nsec` is full nanosecond precision. `#strftime`
(`time_with_zone.rb:223-227`) delegates to that same `Time`, which is why
Ruby's `%N` answers nine real digits.

Surfaced by PR #6144 / #6147, which routed `TimeWithZone#strftime` onto
`packages/date`'s formatter: the formatter takes `nsec` and formats `%N` to
nine digits, but the caller can only ever hand it a millisecond-derived value,
so the last six digits are structurally zero.

## Converged shape

`nsec` and `usec` read the nanoseconds off `_zoned` rather than multiplying
`msec`. `_local()` grows the sub-millisecond fields (or the two getters go
direct to `this._zoned`), and `strftime`'s `nsec:` argument then carries real
precision without further change.

## Acceptance criteria

- [ ] `TimeWithZone#nsec` answers the receiver's full nanoseconds; `#usec` its
      full microseconds.
- [ ] `strftime("%N")` answers nine significant digits for a time built with
      sub-millisecond precision, and `%L` is unchanged for one that is not.
- [ ] The stale "JS doesn't have sub-ms precision" comment is deleted.
- [ ] No existing `time-with-zone` test is renamed; check `inspect` and
      `xmlschema`, which also format fractional seconds off `millisecond`.
