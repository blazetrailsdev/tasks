---
title: "Score file-local helpers and @perf _ helpers in the privates lane, with a perf sub-count"
status: done
updated: 2026-11-04
rfc: "0218-api-privates-extra-surface"
cluster: api-compare
packages: []
deps: [privates-surface-report]
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9719
claim: "2026-11-04T17:01:39Z"
assignee: "privates-surface-file-local-and-perf-helpers"
blocked-by: null
closed-reason: null
---

## Context

The RFC's Design, "`@perf` helpers". `extractFileLocalHelpers`
(`scripts/api-compare/extract-ts-api.ts:4608-4680`) emits `aliasOf` bodyless
rows for `const x = fn` (`:4636-4656`); scoring both would count one helper
twice. `CLAUDE.md § "Speed"` says `@perf` exempts nothing and that the `_`
prefix is what keeps a perf helper out of `countTsInternalNames`; the
privates lane scores `_` names, so it must say how a `@perf` helper reads.
`blazetrails/perf-tag-placement` (`eslint/perf-tag-placement.mjs`) holds the
tag's shape.

## Acceptance criteria

- An `aliasOf` helper row is scored through its target only.
- A `@perf`-tagged declaration is scored like any other (credited, moved or
  novel); nothing is subtracted for the tag.
- The extractor records `@perf` on a `MethodInfo` (today `perf` is only in
  its known-tag list, `scripts/api-compare/extract-ts-api.ts:262-269`, and is
  not carried on the record), for members and for `extractFileLocalHelpers`
  rows.
- A `perf` sub-count of `novel` + `moved` rows carrying `@perf` is printed and
  emitted in JSON.
- `countTsInternalNames` and the public lane are unchanged; a test pins that
  `parity:api:extra`'s `Intrnl` total is unchanged.
- The RFC's Verification cross-check is a test here, on fixture manifests:
  `Intrnl = population − (_-prefixed rows) + (aliasOf rows)` over files
  `extra-surface.ts:2638` does not skip, with one fixture case per term and
  one for a JSDoc-`@internal` declaration carrying a receipt (in neither
  count).
