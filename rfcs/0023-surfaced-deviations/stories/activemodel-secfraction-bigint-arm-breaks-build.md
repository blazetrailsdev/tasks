---
title: "activemodel-secfraction-bigint-arm-breaks-build"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Fixed on main: activemodel/src/type/date-time.ts:73 handles the bigint arm explicitly and time.ts:170 typechecks; build green at 621d49cce."
---

## Context

`pnpm build` is red on `origin/main` (77eb0ebdb) — every CI job that runs the
build step fails, so all PRs are blocked:

```text
packages/activemodel/src/type/date-time.ts(75,20): error TS2365: Operator '*'
  cannot be applied to types 'number | bigint' and 'number'.
packages/activemodel/src/type/time.ts(170,7): error TS2345: Argument of type
  'number | bigint | Rational | undefined' is not assignable to parameter of
  type 'number | Rational | null | undefined'.
```

Introduced by #6255 (`fix(activerecord,date): PG connected? asks finished?;
exact %Q/%s seconds; relocate the parity pipeline`), which widened
`DateParts.secFraction` to `number | bigint | Rational` at
`packages/date/src/date.ts:624`. Two activemodel consumers were not updated:

- `packages/activemodel/src/type/date-time.ts:70-76` — `microseconds()`
  narrows only `Rational`, then does `secFraction * 1_000_000` on the
  remaining `number | bigint`.
- `packages/activemodel/src/type/time.ts:170` — forwards `timeHash.secFraction`
  into a parameter still typed `number | Rational | null | undefined`.

Reproduce with `tsc --build packages/activemodel --force` (a warm
`.tsbuildinfo` masks it — the incremental build passes).

Rails reference: `secFraction` mirrors Ruby's `Date._parse` `:sec_fraction`,
which is always a Rational (`ext/date/date_core.c`); #6186 made trails'
`Rational` bigint-backed, which is where the `bigint` arm in the union comes
from.

## Acceptance criteria

- `pnpm build` green on main.
- The two call sites handle the `bigint` arm rather than the union being
  narrowed away at the declaration (or `DateParts.secFraction` is tightened to
  what `Date._parse` actually produces, with the producers updated to match).
- No `as` casts introduced at either site.
