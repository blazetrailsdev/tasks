---
title: "The Date arm is unreachable from outside activesupport — give it a subpath export"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6455
claim: "2026-08-13T03:16:53Z"
assignee: "naming-burndown-2-ar-associations-a1a3-residue"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/date-ext.ts` (added by PR #6197) is the `Date` arm of
`activesupport/lib/active_support/core_ext/date/calculations.rb`, but it is NOT
re-exported from `packages/activesupport/src/index.ts`, so a consumer of
`@blazetrails/activesupport` cannot reach `Date#ago` / `since` /
`beginningOfDay` / `middleOfDay` / `endOfDay` at all. Only in-package importers
(`core-ext/date-ext.test.ts`) use it today.

The blocker is that `export * from "./time-ext.js"` (index.ts:346) already
exports `ago`, `since`, `beginningOfDay`, `middleOfDay`, `endOfDay`, `advance`,
`change`, `current` — the `Time` arm's spellings of the same Ruby names. In Ruby
they never collide: they are methods on two different receivers. In a flat ESM
namespace they do.

index.ts:520-524 documents the established precedent for exactly this: the
`core-ext/range` conversions stay reachable as a subpath import
(`@blazetrails/activesupport/core-ext/range/conversions`) "the way Rails users
reach them through `require "active_support/core_ext/range/..."`", because
re-exporting would collide with `time-ext.ts`'s `to_fs`.

## Converged shape

Give `date-ext.ts` the same subpath export the range core_ext files have —
`@blazetrails/activesupport/date-ext` (or `core-ext/date/calculations`,
whichever the existing subpath map spells) — so the `Date` arm is reachable
under its Rails path without shadowing the `Time` arm in the flat index.

Note the registration cost: a new cross-package subpath needs the vitest alias
and BOTH dx-test tsconfigs, not just the package `exports` map; `pnpm typecheck`
does not catch a missing one.

## Acceptance criteria

- [ ] The `Date` arm is importable from outside the package under a subpath that
      mirrors its Rails require path.
- [ ] `index.ts`'s flat exports still resolve `ago`/`since`/… to the `Time` arm;
      no name shadows another.
- [ ] The subpath is registered everywhere a cross-package subpath must be.

## Sweep note (2026-08-12)

**Path corrected:** `packages/activesupport/src/date-ext.ts` was moved to
`packages/activesupport/src/core-ext/date/calculations.ts` by PR #6286. The gap
is unchanged — the package `exports` map carries only `./core-ext/range/conversions`
and `./core-ext/range/each`, so the `Date` arm is still unreachable from outside
the package. The obvious subpath is now `./core-ext/date/calculations`, which
mirrors the Rails require path directly.
