---
title: "Delete _cachedAssociations + migrate test pokes"
status: in-progress
updated: 2026-06-13
rfc: "0022-singular-association-holder"
cluster: associations
deps:
  ["b1-singular-association-holder", "b2-serialization-via-reader", "b3-migrate-singular-readers"]
deps-rfc: []
est-loc: 250
priority: 4
pr: 3188
claim: "2026-06-13T12:35:10Z"
assignee: "b4-delete-cached-associations"
blocked-by: null
---

## Context

With every production writer (b1) and reader (b2, b3) off `_cachedAssociations`,
the field can be deleted. This is the capstone: remove the map and migrate the
~150 direct test pokes across 13 files onto `record.association(name)` or a thin
`record._associationCache(name)` accessor whose shape mirrors Rails'
`@association_cache[name]` (returns the Association object). This is the work
that RFC 0006 S4 deferred when it chose Option A.

## Acceptance criteria

- [ ] `_cachedAssociations` deleted from `base.ts` and from the host interfaces
      in `persistence.ts`, `validations.ts`, `autosave-association.ts`,
      `association-relation.ts`, and `activemodel/src/serialization.ts`.
- [ ] The b2 `_loadedAssociationTarget` host-interface method is either removed
      (if callers went through `association(name)` directly in b3) or retained and
      renamed to the permanent `_associationCache(name)` accessor (RFC open
      question 3: return the Association object, so callers read `.target`). Note:
      the RFC-0006 S1 `_cachedAssociationTarget` shim is also removed here.
- [ ] All ~150 test pokes (13 files: `autosave.test.ts`,
      `autosave-association.test.ts`, `associations.test.ts`,
      `json-serialization.test.ts`, `nested-attributes.test.ts`,
      `associations/collection-proxy.test.ts`,
      `associations/inverse-associations.test.ts`,
      `associations/has-one-associations.test.ts`,
      `associations/association-relation.test.ts`,
      `strict-loading-sync-reader.test.ts`,
      `associations/has-many-through-associations.test.ts`,
      `validations/i18n-validation.test.ts`,
      `validations/association-validation.test.ts`) compile against the new
      accessor / `association(name)`. **No test renames.**
- [ ] `grep -rn _cachedAssociations packages` returns zero hits outside historical
      changelog/comment references.
- [ ] Full association + serialization + validation + autosave + nested-attributes
      suites pass.
- [ ] `api:compare` delta non-negative.

## Notes

This story is large and mechanical; if it exceeds the 300-LOC trails ceiling,
split the poke migration by test file into sibling stories off `main` (one PR per
file or small group), keeping the field-deletion PR last. Do NOT stack. Undeclared-
association pokes (`FakeTopic`, anonymous classes in `validations/*` and
`json-serialization`) need either a real declaration or the
`_associationCache(name)` accessor that tolerates unknown names the way
`@association_cache` does.
