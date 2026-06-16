---
title: "Convert autosave-association.test.ts to canonical TEST_SCHEMA + official models"
status: draft
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/autosave-association.test.ts` (4903 lines, 26
describe blocks, 208 tests) is on `eslint/require-canonical-schema-exclude.json`
(grandfathered — the canonical-schema lint is OFF for it). It was built on a
bespoke `UNIVERSAL_AUTOSAVE_SCHEMA` `defineSchema` bootstrap plus ~49 bespoke
local model classes whose names collide with canonical models (`Author`,
`Book`, `Post`, `Comment`, `Company`, `Firm`) — importing the canonical models
into the file triggers the constructor-name table dedup (`author2s`,
`company2s`, `firm2s`), breaking sibling tests.

First slice landed in PR for RFC 0030 story `d5-autosave-locking-residuals`:
all 26 describes were marked `describe.skip` (so bespoke classes never
instantiate and stop colliding), and three describes were converted to
canonical models + canonical `TEST_SCHEMA` and un-skipped:

- `TestAutosaveAssociationOnAHasManyAssociationWithInverse` (after save callback)
- `TestAutosaveAssociationOnAHasManyAssociationDefinedInSubclassWithAcceptsNestedAttributes`
  (Agency/Project nested attributes)

This story covers converting the **remaining 23 skipped describes** (≈206
skipped tests) to canonical `TEST_SCHEMA` + official models in
`packages/activerecord/src/test-helpers/models/`, in ≤500-LOC slices. The
final slice must remove `UNIVERSAL_AUTOSAVE_SCHEMA` + its global bespoke
`beforeAll`, and remove the file from
`eslint/require-canonical-schema-exclude.json` (flipping the lint ON).

STRICT (RFC 0019): `defineSchema` may pass ONLY canonical `TEST_SCHEMA` tables —
never a bespoke/inline shape or free table name. If the canonical schema is
genuinely missing something, add it to `TEST_SCHEMA` (a 0019 gap), do not
reintroduce bespoke `defineSchema`.

## Acceptance criteria

- [ ] All 23 remaining describes converted to canonical `TEST_SCHEMA` + official
      models (or Rails-faithful nested classes on canonical tables where Rails
      itself uses local classes), and un-skipped.
- [ ] `UNIVERSAL_AUTOSAVE_SCHEMA` and the global bespoke `beforeAll` removed.
- [ ] `packages/activerecord/src/autosave-association.test.ts` removed from
      `eslint/require-canonical-schema-exclude.json`; the canonical-schema lint
      passes with it ON.
- [ ] No `it.skip`/`describe.skip` residue except permanent skips
      (Marshal/YAML/thread/fork/Rational) with recorded reasons.
- [ ] Convert in ≤500-LOC slices; register follow-on slices via `pnpm tasks new`.
