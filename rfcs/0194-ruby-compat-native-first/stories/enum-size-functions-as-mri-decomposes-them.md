---
title: "ruby-compat: restore enum_size / each_slice_size / each_cons_size as MRI's named functions"
status: in-progress
updated: 2026-10-27
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9386
claim: "2026-10-27T20:08:43Z"
assignee: "call-gate-credits-filter-length-count-and-nested-native-forms"
blocked-by: null
closed-reason: null
---

## Context

trails#9333 had to inline MRI's `enum_size` (`vendor/ruby/v3.3.11/enum.c:467`), `enum_each_slice_size` (`:3127`) and `enum_each_cons_size` (`:3209`) into the size closures of the blockless `minBy` / `maxBy` / `eachSlice` / `eachCons` in `packages/ruby-compat/src/enumerable.ts`. As three module-private functions they raised the extra-surface gate's ruby-compat `internal` count from 914 to 917 (run 40357352923), and that mark only shrinks. `enum_size`'s body is now repeated four times.

Converged shape: three module-private functions named and split as MRI has them. The two size functions call `enum_size`, and each size closure calls the matching function.

## Acceptance criteria

- [ ] `enumSize`, `enumEachSliceSize(obj, args)` and `enumEachConsSize(obj, args)` exist as module-private functions with their `enum.c` citations, and the four size closures call them.
- [ ] The ruby-compat `internal` mark is not raised. Burn down three other ruby-compat `internal` entries in the same PR, or get a repo-owner ruling that module-private functions mirroring MRI statics are not counted.
