---
title: "Retire time-ext.ts's JS-Date to_time arm once its callers move to a Rails receiver"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6556
claim: "2026-08-15T00:45:07Z"
assignee: "adapter-non-boolean-prepared-statements-config-raises"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/time-ext.ts`'s `toTime` now carries three arms
(PR #6550): a ruby/date `Time` receiver and a
`Temporal.PlainDateTime | Temporal.ZonedDateTime` receiver — the two real Rails
methods (`core_ext/time/compatibility.rb:13-15`,
`core_ext/date_time/compatibility.rb:15-17`) — plus a JS-`Date` arm that is
**neither**:

```ts
if (receiver instanceof Date) return instantFrom(receiver);
```

Rails has no `to_time` on a value like that. The arm exists only because trails
callers still hold JS `Date`s; it is documented as not-a-Ruby-method in the
docstring rather than tagged, since the exported name does mirror Rails.

Remaining callers of the JS-`Date` arm at merge time:

- `packages/activesupport/src/core-ext/date-and-time/calculations.ts`
- `packages/activesupport/src/core-ext/range/conversions.ts`
- the JS-`Date`-bound `to time` / `to datetime` tests in `time-ext.test.ts`,
  `core-ext/time-ext.test.ts` and `core-ext/date-time-ext.test.ts`

The same `@boundary-file` JS-`Date` convention runs through the whole of
`time-ext.ts`, so this is one instance of a file-wide question, not a local one.

## Converged shape

Move the remaining callers onto a receiver Rails actually has — a ruby/date
`Time` or the `PlainDateTime | ZonedDateTime` `DateTime` answers — and delete
the JS-`Date` arm, leaving `toTime` as exactly the two Rails methods. The
JS-`Date`-bound tests convert with their receivers; test names stay verbatim
(`parity:test` matches on them).

Probably lands with, or after,
[[port-date-time-calculations-onto-its-own-receiver]] and the `time-ext.ts`
receiver split — the same move that section B of
[[time-with-zone-residue-structural-blockers]] is blocked on.

## Acceptance criteria

- [ ] `toTime` in `time-ext.ts` has only the two Rails arms; the JS-`Date` arm
      and its docstring paragraph are gone.
- [ ] No caller passes a JS `Date` to `toTime`.
- [ ] Test names unchanged; `pnpm parity:test` delta non-negative.
- [ ] `pnpm parity:api` / `pnpm parity:api:calls` deltas non-negative.
