---
title: "Fold date/calculations.ts's duplicate in_time_zone/time_with_zone into the DateAndTime::Zones mixin"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: 6481
claim: "2026-08-13T17:35:42Z"
assignee: "mysql-tasks-drop-url-reparse-fallbacks"
blocked-by: null
closed-reason: null
---

## Context

PR #6465 ported `DateAndTime::Zones`
(`vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/zones.rb:20-38`)
to its Rails path, `packages/activesupport/src/core-ext/date-and-time/zones.ts`,
with both `in_time_zone` and the private `time_with_zone`.

`packages/activesupport/src/core-ext/date/calculations.ts` already carried a
**Date-only copy of the same two methods** — its own `inTimeZone` and private
`timeWithZone`, both citing `date_and_time/zones.rb:20-28` / `:32-38` in their
JSDoc. Both copies now exist. #6465 left a `TODO` at the surviving duplicate
naming the sibling story rather than silently propagating it, but did not fold
them.

Why it was not folded there: the two disagree on the `else` arm's return type.
Rails is `time || to_time`; `date/calculations.ts` returns a `TimeWithZone`,
while the mixin returns the `Temporal.Instant` that trails' `to_time`
(`core-ext/date/conversions.ts:28`) actually yields. Folding therefore changes
the return type of every caller of the Date-arm copy — `ago`
(`date/calculations.ts`), `since`, and anything downstream that calls
`.since(...)` on the result.

## Converged shape

One mixin at the Rails path (`core-ext/date-and-time/zones.ts`), with
`date/calculations.ts`'s `inTimeZone` / `timeWithZone` pair deleted and its
callers routed through it. Resolve the return-type disagreement against Rails:
`in_time_zone`'s no-zone arm is `time || to_time`, so the value is whatever
`Date#to_time` gives, and the callers should be adjusted to that rather than the
mixin bent to preserve `TimeWithZone`.

The in-code `TODO` names `[[converge-time-zone-reader-names]]`, which covers the
adjacent `dateInTimeZone` helper in `time-zone-config.ts` but NOT this pair —
whoever picks up either should clear both, and update or remove that TODO so it
does not point at a story that never covered it.

## Acceptance criteria

- `core-ext/date/calculations.ts` no longer defines `inTimeZone` or
  `timeWithZone`; the single mixin at the Rails path serves the Date arm.
- The `TODO(converge-time-zone-reader-names)` comment at that site is gone.
- Caller return types (`ago`, `since`, and their tests) are corrected against
  Rails rather than the mixin being bent to preserve the old shape.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:extra --package activesupport` does not grow.
