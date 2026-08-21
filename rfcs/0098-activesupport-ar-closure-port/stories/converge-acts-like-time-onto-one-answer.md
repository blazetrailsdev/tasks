---
title: "Answer acts_like?(:time) once, for the Temporal receivers that stand in for Ruby Time"
status: ready
updated: 2026-08-21
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `acts_like?(:time)` is unanswerable by a Temporal receiver, so every call site re-derives the arm

## Context

Surfaced by `port-time-with-zone-method-missing-to-reach-wrap-with-time-zone`
(PR #6832).

Rails' marker is `core_ext/time/acts_like.rb:5-9` — `class Time; def
acts_like_time?; true; end` — read through `Object#acts_like?`
(`core_ext/object/acts_like.rb`). `resolve-time-acts-like-time-after-the-split`
(RFC 0098, PR #6752) paired the marker for `time-ext.ts`'s own receiver, but the
Temporal values that play Ruby's `Time` throughout trails still carry no marker,
because TypeScript cannot reopen `Temporal.Instant` / `Temporal.PlainDateTime`.

So `ObjectExt.actsLike(x, "time")` returns `false` for the very values that ARE
times, and each call site answers the arm itself:

- `packages/activesupport/src/core-ext/date-and-time/calculations.ts:206-210` —
  a module-local `actsLike` whose `:time` arm is
  `x instanceof Date || x instanceof Temporal.Instant`.
- `packages/activesupport/src/time-with-zone.ts`, `_wrapWithTimeZone`
  (`time_with_zone.rb:593-602`) — added in #6832, because without it the ported
  helper never took the wrapping branch and `method_missing` returned raw
  Temporal values instead of `TimeWithZone`s.
- `packages/activesupport/src/core-ext/date-and-time/zones.ts:102` — a third
  spelling, `actsLikeTime(dateOrTime): dateOrTime is Date | Temporal.Instant`.

Three spellings of one Ruby predicate, and they do not agree on the receiver set
(`calculations.ts` and `zones.ts` omit `PlainDateTime`; `time-with-zone.ts`
includes it).

## Converged shape

One answer, in `core-ext/object/acts-like.ts`, where trails' reopening of
`Object` already lives: `Object.actsLike`'s `:time` arm answers `true` for the
receivers that are Ruby `Time`s in this port (JS `Date` and the Temporal moment
types), ahead of the marker-method lookup, exactly as
`core_ext/time/acts_like.rb` makes it true for `Time`. Same for `:date` against
`core_ext/date/acts_like.rb`.

Then delete the three local re-derivations and route them through it. Settle the
receiver set once — in particular whether `PlainDateTime` is a moment for
`:time` — rather than per site.

## Acceptance criteria

- [ ] `Object.actsLike(x, "time")` is true for every trails receiver that stands
      in for a Ruby `Time`, with the Rails file cited.
- [ ] `calculations.ts`' local `actsLike`, `zones.ts`' `actsLikeTime`, and
      `time-with-zone.ts`' inline arm are gone, all reading the one answer.
- [ ] `parity:api:extra --package activesupport` does not gain names, and the
      TimeWithZone `method_missing` / `wrap_with_time_zone` cases still pass.
