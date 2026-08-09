---
title: "actionpack-http-cache-layer-uses-js-date"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: framed as a decision, and its own text accepts 'keep JS Date as the documented HTTP wire boundary' as an outcome. Rails' if_modified_since returns a Time only because Ruby has no wire type; no behavioral divergence to converge."
---

## Context

Trails' settled convention is that `Temporal` is the `Time` analogue and a JS
`Date` is not a value type. It is **enforced**, not merely followed:
`packages/activerecord/src/connection-adapters/abstract/quoting.ts:162,219` throw
on a JS `Date` — `"quote: JS Date is not accepted — use a Temporal type
(Instant, PlainDateTime, etc.)"` — and the sqlite3/mysql/pg quoting files do the
same. Declared value types are Temporal throughout:
`activemodel/src/type/date.ts:15` (`DateCastResult = Temporal.PlainDate | …`),
`type/date-time.ts:18` (`DateTimeCastResult = Temporal.Instant | …`),
`activesupport/src/time-with-zone.ts:108-327` (`Temporal.ZonedDateTime` internally,
`toDate()` → `PlainDate`, `toTime()` → `Instant`). JS `Date` survives elsewhere
only as a _coercible input_ (`type/date.ts:41`, `type/date-time.ts:228`).

**actionpack's HTTP cache layer is the one place JS `Date` is the declared public
type:**

- `packages/actionpack/src/action-dispatch/http/cache.ts:35` — `lastModified?: Date`
- `cache.ts:38` — `ifModifiedSince(): Date | undefined`
- `cache.ts:110,157` — `parseRfc2822Date`, `parseHttpDate` return `Date | undefined`
- `cache.ts:183-196` — `lastModified` / `date` accessors
- `packages/actionpack/src/action-dispatch/http/response.ts:342-343`,
  `request.ts:355,358` — the `declare`d mirrors

This may well be **correct as-is** — HTTP header dates are an RFC 2822/1123
wire format at a Node boundary, and Rails' own `Request#if_modified_since` returns
a `Time` because Ruby has no separate wire type. The question is whether trails
should expose `Temporal.Instant` at this seam and convert at the header edge, or
keep JS `Date` as the deliberate boundary type.

Surfaced by the `0088-date-gem-port` audit, which found this is the _only_
remaining declared-JS-`Date` public surface once
`activesupport/src/range-ext.ts` moves. **This story is a decision, not
automatically a conversion** — "keep it, documented" is an acceptable outcome
provided it is written down at the call site.

## Acceptance criteria

- [ ] Read Rails' `actionpack/lib/action_dispatch/http/cache.rb` and record what
      `if_modified_since` / `last_modified` actually return there.
- [ ] Decide: convert the seam to `Temporal.Instant`, or keep JS `Date` as the
      documented HTTP wire boundary.
- [ ] If keeping: a `@boundary-file`-style JSDoc note at `cache.ts` recording the
      reason, so the next audit does not re-open it.
- [ ] If converting: `parseHttpDate` / `parseRfc2822Date` return
      `Temporal.Instant | undefined`, callers updated, header formatting still
      emits RFC 1123 (`toUTCString()` equivalent).
- [ ] Either way, no change to the AR quoting guards — those are the convention
      working correctly.
