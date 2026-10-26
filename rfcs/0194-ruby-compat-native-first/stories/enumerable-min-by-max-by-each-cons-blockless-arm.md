---
title: "minBy/maxBy/eachCons/eachSlice answer a sized enumerator without a block"
status: ready
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9296 ported `minBy`, `maxBy` and `eachCons` as free functions in `packages/ruby-compat/src/enumerable.ts`. None of them has a blockless arm:

- `enum_min_by` (`vendor/ruby/v3.3.11/enum.c:2686`) and `enum_max_by` (`:2760`) start with `RETURN_SIZED_ENUMERATOR(obj, argc, argv, enum_size)`, so a call without a block answers an Enumerator. The port requires the block.
- `enum_each_cons` (`:3244`) runs `RETURN_SIZED_ENUMERATOR(obj, 1, &n, enum_each_cons_size)` after its size guard. The port answers an Array of windows instead. `eachSlice` (`:3166`) has the same gap.

The sibling story `enumerable-sort-by-blockless-arm` covers `sortBy`. These functions should converge the same way.

## Acceptance criteria

- [ ] Called without a block, `minBy` / `maxBy` (with or without `n`) answer `toEnum`, sized by `enum_size`.
- [ ] Called without a block, `eachCons` / `eachSlice` answer `toEnum`, sized by `enum_each_cons_size` / `enum_each_slice_size`. The `invalid size` guard still runs first for `eachCons`.
- [ ] Callers that read the blockless Array result (`association-scope.ts:71`, `array.ts`'s `eachCons` table entry) pass a block or call `toA`.
- [ ] Tests in `enumerable.trails.test.ts` cover the enumerator arm of each function.
