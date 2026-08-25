---
title: "Converge Time.new onto Ruby's public local-zone constructor"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6062
claim: "2026-08-04T13:53:49Z"
assignee: "i18n-time-new-is-private"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/time.ts:32` (landed by PR #6053) makes `Time`'s constructor
`private`, so the only way to build one is `Time.utc(...)`
(`packages/i18n/src/time.ts:23`). Ruby's `::Time` has a public `Time.new`
alongside `Time.utc`, and the two differ: `Time.new` builds a time in the
_local_ zone, `Time.utc` in UTC.

The constructor was hidden because trails models only UTC here — a public TS
constructor reads as `Time.new` and would quietly mean UTC, which is the wrong
answer rather than a missing one. That reasoning is recorded in the JSDoc at
the call site, but it leaves `Time.new` absent from a class whose whole point
is to be the Ruby duck type, and a caller reaching for it finds nothing.

The `%z` directive is fixed at `+0000` for the same reason
(`packages/i18n/src/date.ts`, the shared `strftime`), so local-zone support is
a two-part change.

## Converged shape

Give `Time` a public constructor with Ruby's `Time.new` semantics — local
zone, `Time.utc` staying the UTC entry point — and let `%z`/`%Z` answer the
real offset for a non-UTC receiver. trails already has zone machinery to lean
on in `packages/activesupport/src/values/time-zone.ts`, but note the direction
of the package graph: `packages/i18n` cannot import from
`packages/activesupport`, so anything shared has to land on the i18n side or
be passed in.

## Acceptance criteria

- `new Time(...)` is public and means what Ruby's `Time.new` means, or the
  omission carries a `@noRailsEquivalent PERMANENT` receipt naming `Time.new`
  and why no port can supply it.
- `Time.utc` keeps its current behaviour, and the localization tests
  (`packages/i18n/src/backend/localization.test.ts`) are unchanged.
- `%z` and `%Z` answer the receiver's actual zone rather than a constant.
