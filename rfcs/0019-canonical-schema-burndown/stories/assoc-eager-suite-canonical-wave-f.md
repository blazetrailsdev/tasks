---
title: "Converge remaining eager.test.ts bespoke clusters to canonical (wave F)"
status: in-progress
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: ["assoc-eager-suite-canonical-wave-e"]
deps-rfc: []
est-loc: 500
priority: null
pr: 4252
claim: "2026-06-29T02:10:39Z"
assignee: "assoc-eager-suite-canonical-wave-f"
blocked-by: null
---

## Context

Continuation of `assoc-eager-suite-canonical-wave-e` (#4251, RFC 0019). Wave E
converged the two has-many-through-with-order tests in the first
`EagerAssociationTest` describe block of
`packages/activerecord/src/associations/eager.test.ts` onto canonical
`OrderedTag`/`Tagging`/`Post` models and removed the `eager_hmt_ord_*` /
`eager_hmt_mo_*` `TEST_SCHEMA` entries.

The file still has ~80 bespoke inline classes across the remaining first-block
clusters and the 22 later `EagerAssociationTest` describe blocks (lines ~2200+):

- `EagerLeo*`, `EagerLmo*`, `EagerLn*` — limited-eager (eager_test.rb:976-1019;
  real versions use Post+author+comments fixtures, UPPER(posts.title) order with
  limit/offset, Person number1_fan — converting may surface impl gaps; accept
  skips + un-skip follow-up).
- `EagerMultiHo*`, `EagerMultiBt*` — multiple-associations-same-table.
- `StiShare*`, `EagerPk*`, `IncPk*`, `EagerEmptyBt*`, `EagerReord*`, `PrePoly*`,
  `Sg*` shared classes + `seedSponsors()` — misc / polymorphic guard.
- all bespoke classes + `defineSchema(<inline>)` in the 22 later describe blocks.

Key Rails reference:
`vendor/rails/activerecord/test/cases/associations/eager_test.rb`.

## Acceptance criteria

- Remaining bespoke inline classes in `eager.test.ts` converted to canonical
  models + fixtures (or deleted, for trails-only deviation tests).
- Final wave: remove `defineSchema(TEST_SCHEMA)` from the first block's
  `beforeAll`, delete the `TEST_SCHEMA` constant, and drop `eager.test.ts` from
  `eslint/require-canonical-schema-exclude.json` (only possible once ALL bespoke
  classes are gone — the lint rule is file-scoped).
- Test names match Rails verbatim; camelCase; no node:_/process._; async fs only.
- All tests pass; net skip delta documented with un-skip story.
- LOC <= 500 per PR; multiple waves allowed (wave F, G, ... as needed).
