---
title: "Relation finder, calculation, batch and merger types without any"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-activerecord
packages: [activerecord]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`relation.ts` (37), `relation/finder-methods.ts` (33), `relation/batches.ts`
(19), `relation/merger.ts` (18), `relation/calculations.ts` (18) and
`relation/delegation.ts` (15) hold 140 hits. `find` / `first` / `take`
returning `any` lose the model type for every caller.

## Acceptance criteria

- [ ] Combined hits in those six files fall by at least 60%.
- [ ] `find`, `findBy`, `first`, `last`, `take` and their bang forms return
      `T` / `T | null` / `T[]` per Rails' arity arms.
- [ ] `findEach` / `findInBatches` / `inBatches` yield typed records /
      relations.
- [ ] dx-tests cover `first()`, `find(id)` and `findEach` return types.

## Verification

Before and after counts, recorded in the PR body, from the trails root:
`grep -rPc ': any\b|as any\b|as unknown as' packages/activerecord/lib --include=*.ts`
over the files named above. `pnpm typecheck`, `pnpm parity:lint:counts`,
`pnpm test:types`, `pnpm parity:api` and `pnpm parity:test` are green, with
non-negative parity deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
