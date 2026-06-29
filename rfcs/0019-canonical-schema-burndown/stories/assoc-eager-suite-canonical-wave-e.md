---
title: "Converge remaining eager.test.ts bespoke clusters to canonical (wave E)"
status: in-progress
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: ["assoc-eager-suite-canonical-wave-d"]
deps-rfc: []
est-loc: null
priority: null
pr: 4251
claim: "2026-06-29T01:27:00Z"
assignee: "assoc-eager-suite-canonical-wave-e"
blocked-by: null
---

## Context

Continuation of `assoc-eager-suite-canonical-wave-d` (RFC 0019). Wave D converged the 5
trails-only inline-class tests in the FIRST `EagerAssociationTest` describe block of
`packages/activerecord/src/associations/eager.test.ts` onto canonical Post/Author models
(`should work inverse of with eager load`, the 3 `eager association loading with explicit
join {belongs to,has one,marks empty association loaded}` proxy tests, and `exceptions
have suggestions for fix`) and removed their file-local `TEST_SCHEMA` entries
(`eager_inv_*`, `ej_bt_*`, `ej_ho_*`, `ej_em_*`, `ex_sug_*`).

The file is large: ~88 bespoke inline classes across 23 `describe` blocks. The file-local
`TEST_SCHEMA` constant is still required by the remaining first-block tests, and 22 later
`describe` blocks each call `defineSchema(<inline>)` with their own bespoke shapes.

Remaining bespoke clusters to converge (canonical models + fixtures, or delete trails-only
deviations), roughly in first-block order:

- `EagerHmtOrd*`, `EagerHmtMo*` — has-many-through-with-order tests
- `EagerLeo*`, `EagerLmo*`, `EagerLn*` — limited-eager tests (Rails eager_test.rb:976–1019;
  real versions use Post+author+comments fixtures and UPPER(posts.title) ordering /
  Person number1_fan — converting may surface impl gaps; accept skips + un-skip follow-up)
- `EagerMultiHo*`, `EagerMultiBt*` — multiple-associations-same-table tests
- `StiShareComment/Post`, `EagerPk*`, `EagerEmptyBt*`, `EagerReord*` — misc
- `Sg*` shared classes (top-level) + `seedSponsors()` — polymorphic guard tests
- all bespoke classes + `defineSchema(<inline>)` in the 22 later `EagerAssociationTest`
  describe blocks (lines ~2222+)

Final wave must also: remove `defineSchema(TEST_SCHEMA)` from the first block's `beforeAll`,
delete the `TEST_SCHEMA` constant, and drop `eager.test.ts` from
`eslint/require-canonical-schema-exclude.json` (only possible once ALL bespoke classes in
the file are gone — the lint rule is file-scoped).

Key Rails reference: `vendor/rails/activerecord/test/cases/associations/eager_test.rb`.

## Acceptance criteria

- All remaining bespoke inline classes in `eager.test.ts` converted to canonical models +
  fixture data (or deleted, for trails-only deviation tests).
- `defineSchema(TEST_SCHEMA)` removed; `TEST_SCHEMA` constant removed.
- `eager.test.ts` removed from `eslint/require-canonical-schema-exclude.json`.
- All tests pass; net skip delta documented with un-skip story.
- LOC ≤ 500 per PR; multiple waves allowed (wave E, F, … as needed).
- Test names match Rails verbatim; camelCase; no node:_/process._; async fs only.
