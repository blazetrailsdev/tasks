---
title: "Relation finder, calculation, batch and merger types without any"
status: in-progress
updated: 2026-11-19
rfc: "0242-activerecord-actionpack-type-polish"
cluster: type-polish-activerecord
packages: [activerecord]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 500
priority: null
pr: trails#10334
claim: "2026-11-19T01:36:36Z"
assignee: "turbo-broadcastable-class-methods-and-callbacks"
blocked-by: null
closed-reason: null
---

## Context

`relation.ts` (48), `relation/finder-methods.ts` (35), `relation/batches.ts`
(19), `relation/merger.ts` (20), `relation/calculations.ts` (21) and
`relation/delegation.ts` (18) hold 162 hits. `find` / `first` / `take`
returning `any` lose the model type for every caller.

## Acceptance criteria

- [ ] Hits in the files above fall from 162 to ≤ 65 (at least 60%).
- [ ] `find`, `findBy`, `first`, `last`, `take` and their bang forms return
      `T` / `T | null` / `T[]` per Rails' arity arms.
- [ ] `findEach` / `findInBatches` / `inBatches` yield typed records /
      relations.
- [ ] dx-tests cover `first()`, `find(id)` and `findEach` return types.

## Verification

Count hits from `packages/activerecord/lib`, before and after, and record both in
the PR body:

```sh
grep -Po ': any|as any|as unknown as' relation.ts relation/finder-methods.ts relation/batches.ts relation/merger.ts relation/calculations.ts relation/delegation.ts | wc -l
```

This is the RFC's Motivation command, which counts matches, not lines.
`pnpm typecheck`, `pnpm parity:lint:counts`, `pnpm test:types`,
`pnpm parity:api` and `pnpm parity:test` are green, with non-negative parity
deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
