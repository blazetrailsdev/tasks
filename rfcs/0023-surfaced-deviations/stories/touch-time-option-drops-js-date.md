---
title: "touch(time:) should take Temporal.Instant only, not JS Date"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`touch(*names, time: nil)` in Rails takes a `Time`. trails' `TouchOptions.time`
is typed `Date | Temporal.Instant | null` and `timestamp.ts` converts a JS `Date`
via `Temporal.Instant.fromEpochMilliseconds(t.getTime())` at the boundary
(see the "boundary: accepts JS Date from touch(time:) callers" comment).

This is a surviving JS-`Date` acceptance point. JS `Date` was rejected
AR-wide (PR #939) in favour of `Temporal` as the `Time` analogue, so `touch`
is an exception rather than the rule. Several tests pass raw `Date`s
(`timestamp.test.ts`, `integration.test.ts`,
`associations/belongs-to-associations.test.ts`,
`relation/update-all.test.ts`).

Surfaced while porting `touch(name, { time: })` in PR #4993.

## Acceptance criteria

- `TouchOptions.time` is `Temporal.Instant | null | undefined` only; the
  `Date` arm and the `fromEpochMilliseconds` conversion are deleted.
- Callers passing a JS `Date` are updated to `Temporal.Instant`.
- Confirm `TouchAllOptions.time` (already `Temporal.Instant`) stays the
  reference shape — the two option types should agree.
