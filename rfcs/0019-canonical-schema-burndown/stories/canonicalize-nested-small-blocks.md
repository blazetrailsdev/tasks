---
title: "Canonicalize ~15 single-test nested-attributes describe blocks (lines 1864-2680)"
status: claimed
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-06-19T13:48:26Z"
assignee: "canonicalize-nested-small-blocks"
blocked-by: null
---

## Context

`packages/activerecord/src/nested-attributes.test.ts` lines 1864–2680 contain ~15 small top-level describe blocks (one test each), all using bespoke inline classes with prefixed table names:

- `assigning nested attributes target` (narr*\*), `numeric column changes` (num_posts), `should also work with a HashWithIndifferentAccess` (nsym*\_), `should automatically build` (nbuild\__), `should not assign destroy key` (nad*\*), `should not destroy until parent saved` (nd*_), `should not load association` (nlu\__), `should not overwrite unsaved updates` (mol*\*), `should preserve order` (mol*_), `should raise RecordNotFound` (rnf\__), `should raise UnknownAttributeError` (uahm*\*), `should raise argument error` (rae*_), `should refresh saved records` (nsave\__), `should save only one association` (nsh*\*), `should sort the hash` (narr*_), `should take a hash` (nupd\_\_), `should work with update` (nupd*\*), `validate presence` (npu*\*-ish).

These are good candidates for a single consolidation PR using canonical Pirate/Bird or Post/Comment.

## Acceptance criteria

- Convert all small single-test describe blocks (lines 1864–2680) to canonical models.
- Remove all prefixed bespoke table entries they use from TEST_SCHEMA.
- MolBird/MolPirate module-level classes (lines 168–197) should also be replaced with canonical Pirate/Bird if possible, or kept if the merge-target tests remain.
- Test names verbatim. No regressions in test:compare.
- 500 LOC ceiling, PR from main.
