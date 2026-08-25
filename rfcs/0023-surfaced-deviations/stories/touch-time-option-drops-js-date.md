---
title: "touch(time:) should take Temporal.Instant only, not JS Date"
status: closed
updated: 2026-08-09
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
closed-reason: "Not Rails-convergent: narrows an accepted INPUT type (TouchOptions.time also accepts a JS Date and converts at the boundary). Ruby's touch(time:) takes a Time; accepting an extra coercible input is not a behavioral divergence."
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
