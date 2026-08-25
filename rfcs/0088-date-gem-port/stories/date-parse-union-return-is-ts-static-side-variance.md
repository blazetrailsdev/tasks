---
title: "Date.parse/strptime return a PlainDate|PlainDateTime union only to keep DateTime's override legal"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6265
claim: "2026-08-09T00:15:03Z"
assignee: "date-parse-union-return-is-ts-static-side-variance"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `date-temporal-default-return-and-ruby-opt-in` (PR #6264).

`Date.parse` and `Date.strptime` (`packages/date/src/date.ts`) are declared to
return `Temporal.PlainDate | Temporal.PlainDateTime`. **The runtime value is
always a `PlainDate`** — the union exists only to keep `DateTime`'s statics a
legal override.

Ruby's `DateTime < Date` makes `datetime_s_parse`'s DateTime a covariant
override of `date_s_parse`'s Date (`vendor/date/ext/date/date_core.c`). TS has
no such covariance available here: `Temporal.PlainDateTime` is not a subtype of
`Temporal.PlainDate` (it answers no `toPlainDateTime` / `toPlainYearMonth` /
`toPlainMonthDay`), so declaring the base as `PlainDate` alone makes
`DateTime.parse` an illegal static override — TS2417, "Class static side
'typeof DateTime' incorrectly extends base class static side 'typeof Date'".

PR #6264 verified that a `this`-parameter on both sides does NOT sidestep the
check (TS still reports TS2417), so the union was taken as the smallest shape
that compiles. It is documented at both declarations, but it is a real cost: it
pushes a narrowing onto every `Date.parse` consumer for a value that can never
be a `PlainDateTime`, and `packages/date/src/date.trails.test.ts`'s `ymd` helper
already carries a widened parameter because of it.

## Converged shape

`Date.parse` / `Date.strptime` declared `Temporal.PlainDate`, with
`DateTime.parse` / `DateTime.strptime` still declared `Temporal.PlainDateTime`.
Shapes to try before concluding it is unreachable: a generic `this`-keyed return
on the base statics; declaration merging so the two static sides are not
compared; or moving the statics off the class body into module-level functions
assigned to each class (the trails mixin idiom), which removes the static-side
subtype check entirely while keeping both Ruby names on both classes.

If none of those works, this is ratifiable as a genuine TypeScript language
shortcoming — but only after they have been tried, and the finding should then
be written up once rather than left as two duplicated JSDoc blocks.

## Acceptance criteria

- [ ] `Date.parse` / `Date.strptime` answer `Temporal.PlainDate` with no union,
      or the story is `pnpm tasks block`ed with the specific shapes tried.
- [ ] `DateTime.parse` / `DateTime.strptime` still answer
      `Temporal.PlainDateTime`.
- [ ] `date.trails.test.ts`'s `ymd` helper drops the widened parameter.
- [ ] `pnpm typecheck` green; `pnpm parity:api:extra --package date` clean.
