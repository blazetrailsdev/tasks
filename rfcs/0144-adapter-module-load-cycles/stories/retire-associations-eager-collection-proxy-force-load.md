---
title: "Retire associations.ts's eager collection-proxy force-load so relation/associations stop being load-order dependent"
status: ready
updated: 2026-09-10
rfc: "0144-adapter-module-load-cycles"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0144 Phase 1, and the actual blocker behind both of its stories.

`break-schema-statements-join-table-cycle-blocking-module-eval-includes`
measured that cutting `migration/join-table.ts -> model-schema.ts` with a
zero-import slot does break the adapter cycle (`scripts/test-deps/` green with
the mixin block back at module scope) but reds the whole AR suite at collection
time — `Class extends value undefined` at
`packages/activerecord/src/associations/collection-proxy.ts`.

The reason is that the cut edge was also an accidental load-order guarantee: the
vitest setup preload entered `associations.ts` early through
`join-table -> model-schema -> associations`, so `associations.ts` was always
fully evaluated before `relation.ts`. Cut it, and this path crashes with `Relation` still in TDZ:

```text
relation.ts -> insert-all.ts -> model-schema.ts -> associations.ts
  -> (associations.ts:6, a bare side-effect import of collection-proxy.js)
  -> relation.ts
```

`associations/collection-proxy-slot.ts` already publishes the `CollectionProxy`
constructor, which is what the side-effect import was there to guarantee. The
eager force-load is therefore redundant as well as harmful, and retiring it is
what makes the rest of RFC 0144 measurable.

## Acceptance criteria

- [ ] The bare side-effect import at `packages/activerecord/src/associations.ts:6`
      is gone, along with any sibling eager force-load in that file that exists
      only to seat a constructor the slot module already publishes.
- [ ] `relation.ts` and `associations.ts` no longer depend on module load order:
      verified by a plain-node import of the **built** `dist/**.js` modules,
      entered at each participant in turn, with no TDZ error. A vitest run does
      NOT count — it enters the funnel module first and masks the TDZ (CLAUDE.md,
      "Call-time constant resolution").
- [ ] `scripts/test-deps/` and `adapter-graph-import-tdz.test.ts` are green.
- [ ] The AR suite collects — no `Class extends value undefined`.

## Definition of done

Replacing the force-load with a different eager import, or with a new slot whose
only purpose is to re-create the same load-order guarantee, does not close this
story. The guarantee has to stop being needed.

## Verification

`node -e` over the built `dist` modules, entered at `relation.js`,
`associations.js` and `collection-proxy.js` in turn; then
`pnpm vitest run scripts/test-deps/` and
`pnpm vitest run packages/activerecord/src/adapter-graph-import-tdz.test.ts`.

## Notes

This unblocks `break-schema-statements-join-table-cycle-blocking-module-eval-includes`,
which in turn unblocks `abstract-adapter-mixin-wiring-restore-module-eval`. Do
them in that order; the middle one's own measurement is only valid once this
lands.
