---
title: "converge-object-acts-like-to-this-typed-function"
status: in-progress
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8079
claim: "2026-09-25T03:24:24Z"
assignee: "activesupport-assert-match-drops-respond-to-and-last-match"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8062, which converged `DateAndTime::Calculations` to `this`-typed functions.

Rails' `Object#acts_like?(duck)` (`vendor/rails/activesupport/lib/active_support/core_ext/object/acts_like.rb:33-44`) is an instance method on `Object`, called on implicit or explicit self: `acts_like?(:time)` in `core_ext/date_and_time/calculations.rb:268`, and `date_or_time.acts_like?(:time)` in `:359` and `:363`. trails ports it as `static actsLike(self: unknown, duck: string)` on a stand-in `Object` class (`packages/activesupport/src/core-ext/object/acts-like.ts:5`), with the receiver as argument 1. That is the receiver-as-argument shape trails#8062 retired for `DateAndTime::Calculations`.

Call sites: `core-ext/date-and-time/calculations.ts` (`beginningOfWeek`, `firstHour`, `lastHour`), `core-ext/date-and-time/zones.ts:40` and `time-with-zone.ts:244`.

## Acceptance criteria

- `actsLike` is a `this`-typed function (`function actsLike(this: unknown, duck: string)`), called as `actsLike.call(x, "time")`, with the Rails body: `case duck when :time … when :date … when :string … else respond_to?(:"acts_like_#{duck}?")`.
- Every call site above uses the `.call` form, with the receiver Rails uses (`self` or `date_or_time`).
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay clean with no new rows.
