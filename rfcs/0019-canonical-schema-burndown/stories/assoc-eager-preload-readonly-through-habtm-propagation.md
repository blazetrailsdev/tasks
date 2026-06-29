---
title: "assoc-eager-preload-readonly-through-habtm-propagation"
status: ready
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

While converging `eager.test.ts` to canonical models (wave G, RFC 0019), the
real Rails test `test "preloading readonly association"`
(`vendor/rails/activerecord/test/cases/associations/eager_test.rb:1579`) was
ported but had to be `it.skip`-ped. trails' preloader only propagates a
`readonly()` reflection scope to the **has-one** source path
(`Firm.preload(:readonly_account)` → record `isReadonly()` true). The
**has_many :through** (`Author.preload(:readonly_comments)`) and **HABTM**
(`Project.preload(:readonly_developers)`) paths load source records via
`preloader/through-association.ts` `_getSourcePreloaders` and do NOT carry the
reflection scope's `readonlyValue` onto the instantiated records.

The sibling `eager_load` tests (`eager-loading readonly association`) DO
propagate readonly (join path), so this is specific to the preload path.

Likely fix site: `packages/activerecord/src/associations/preloader/through-association.ts`
`_getSourcePreloaders` / `_partitionReflectionWhere` — ensure the source
preloader scope inherits `readonlyValue` from the reflection scope so
`loadRecordsForKeys` instantiates readonly records.

## Acceptance criteria

- Remove `it.skip` on `preloading readonly association` in
  `packages/activerecord/src/associations/eager.test.ts`; all three branches
  (has-one, HABTM, has_many :through) assert `isReadonly()` true and pass.
- No regression to the `eager-loading readonly association` / non-readonly tests.
