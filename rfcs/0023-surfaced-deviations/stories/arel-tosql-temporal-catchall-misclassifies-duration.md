---
title: "to-sql's isTimeLike catch-all misclassifies Duration/PlainYearMonth/PlainMonthDay as Time"
status: in-progress
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4896
claim: "2026-07-15T22:21:11Z"
assignee: "arel-tosql-temporal-catchall-misclassifies-duration"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4884
(arel-dot-unknown-class-leaf-fallback-should-raise), which converged the same
bug in `Dot`. The reviewer raised `to-sql.ts:98` explicitly; it was deferred as
outside that PR's scope.

`isTimeLike` (`packages/arel/src/visitors/to-sql.ts`) treats **any** Temporal
tag that isn't `Temporal.PlainDate` as time-like:

```ts
function isTimeLike(v: unknown): boolean {
  if (temporalTag(v) !== null) return !isDateOnly(v);
  ...
}
```

So `visitNodeOrValue` routes `Temporal.Duration`, `Temporal.PlainYearMonth`, and
`Temporal.PlainMonthDay` to `visitTime` → `unsupported` → `UnsupportedVisitError`.

Rails has no such catch-all. `Visitor#visit` (`visitor.rb:36-41`) dispatches on
`object.class` and walks `object.class.ancestors`; there is no
`visit_ActiveSupport_Duration` in `to_sql.rb`, and `ActiveSupport::Duration` is a
plain `Object` subclass (`activesupport/lib/active_support/duration.rb:14`), not
a `Numeric` — so no ancestor answers and Rails raises
`TypeError, "Cannot visit ActiveSupport::Duration"` (`visitor.rb:39`).

Both raise, so this is not a wrong-output bug — the divergence is the error
class and message. `visit_Time`/`visit_Date`/`visit_DateTime` are aliased to
`unsupported` (`to_sql.rb:836-844`), which raises `UnsupportedVisitError`; that
is correct **only** for types that genuinely map to Ruby's Time/Date.

PR #4884 fixed the identical shape in `dot.ts` by replacing the
`startsWith("Temporal.")` catch-all with an explicit whitelist,
`TEMPORAL_CLASS_NAMES`, mapping the five tags that have a real Ruby analogue
(`PlainDate`→Date, `PlainDateTime`→DateTime, `Instant`/`ZonedDateTime`/
`PlainTime`→Time) and letting everything else fall through to the raise.
`to-sql.ts` should share that whitelist rather than keep a second, looser copy —
both files already share `temporalTag` from `packages/arel/src/temporal-tag.ts`
(added by #4884), which is the natural home for it.

## Relationship to `arel-visit-dispatches-raw-classes-like-rails`

That story (draft, est 120) proposes retiring `visitNodeOrValue` so raw values
class-dispatch through `visit`, which would delete `isDateOnly`/`isTimeLike`
outright and make `Duration` reach the ancestor walk naturally. It does not
mention Temporal — it is scoped to Integer/String — so the question of _which_
Temporal tags map to _which_ Ruby class still needs an explicit answer there.
Either sequence works: land this small fix first, or fold the whitelist into
that restructure. If that story lands first, close this one as done against it.

## Acceptance criteria

- [ ] `Temporal.Duration` / `PlainYearMonth` / `PlainMonthDay` no longer
      classify as time-like in `to-sql.ts`, and reach the same
      no-visitable-ancestor path Rails takes at `visitor.rb:39` rather than
      being mislabelled as Ruby `Time`.
- [ ] The Temporal→Ruby-class mapping is shared with `dot.ts` rather than
      duplicated (`TEMPORAL_CLASS_NAMES` lives beside `temporalTag` in
      `packages/arel/src/temporal-tag.ts`).
- [ ] `Instant` / `ZonedDateTime` / `PlainTime` still reach `visit_Time` and
      `PlainDate` still reaches `visit_Date`, preserving current behaviour for
      every type with a real analogue.
- [ ] api:compare / test:compare delta non-negative.
