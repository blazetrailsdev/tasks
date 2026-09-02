---
title: "Seat the Temporal Time reading in object.ts so comparable.ts stops exporting hasEpochNanoseconds"
status: draft
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7394 ported `rb_obj_class` (`vendor/ruby/object.c:296`) into a new
`packages/ruby-compat/src/object.ts` and deleted the six private copies. Its
`Time` arm reads a Temporal value's `epochNanoseconds`, and that type guard
already existed as a PRIVATE function in `packages/ruby-compat/src/comparable.ts`
(used by `cmp`, `comparable.ts:81`). To reach it from `object.ts` the PR
EXPORTED it:

    /**
     * @internal
     * @noRailsEquivalent PERMANENT
     */
    export function hasEpochNanoseconds(value: unknown): value is { epochNanoseconds: bigint }

That is new public ruby-compat surface with a bare `PERMANENT` receipt carrying
no MRI citation — because MRI has no counterpart at all. `rb_obj_class` reads
`RBASIC_CLASS(obj)` off the `T_DATA` object; there is no "does this quack like a
Time" predicate in `object.c` to point at. The tag is therefore a receipt for a
name Rails would not recognise, sitting in ruby-compat, whose `novel` is pinned
at 0 precisely to stop that shape accumulating.

## Converged shape

Seat the Temporal reading once, in `object.ts`, and have `comparable.ts` import
it rather than the reverse — `object.ts` already owns the "what class is this
value" question, and `cmp` (`vendor/ruby/compar.c`) is a consumer of that
reading, not its owner. `comparable.ts` then exports nothing new, the receipt
disappears with the export, and ruby-compat's `total` mark narrows by one via
`pnpm parity:api:extra:tighten`.

Watch the import cycle: `comparable.ts` already imports `rbObjClass` from
`object.js`, and `object.ts` imports `rubyClass` from `comparable.js`. Both
reads are inside function bodies, so the cycle is TDZ-safe today; moving the
guard keeps it that way (one more function-body read in the same direction).
Verify with a plain-node import of the BUILT `dist/**.js` modules as entry
modules, per CLAUDE.md — a vitest run enters the funnel module first and masks
a TDZ.

## Acceptance criteria

- `hasEpochNanoseconds` is not exported from `packages/ruby-compat/src/comparable.ts`;
  the Temporal reading lives in `object.ts` beside `rbObjClass`, private there,
  and `cmp` imports it.
- No `@noRailsEquivalent` receipt survives for it — the name is private, so it
  needs none.
- `pnpm parity:api:extra:gate` green with ruby-compat's `total` narrowed by
  `pnpm parity:api:extra:tighten` (never raised).
- `pnpm exec tsx scripts/api-compare/extra-surface.ts` exits 0 (no STALE tag).
- Both directions of the `comparable.ts` / `object.ts` cycle verified against
  built `dist/**.js` entry modules.
