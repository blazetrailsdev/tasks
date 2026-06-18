---
title: "Canonicalize TestNestedAttributesOnAHasOneAssociation makeModels() block"
status: ready
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/nested-attributes.test.ts` lines 566–875: `TestNestedAttributesOnAHasOneAssociation`. Uses a local `makeModels()` factory that creates fresh `class Ship` / `class Pirate` on the canonical `ships`/`pirates` tables with different `acceptsNestedAttributesFor` options per test (allowDestroy, rejectIf, updateOnly). Also has one inline test that creates bespoke `PolyOwner`/`PolyTarget` classes on `poly_owners`/`poly_targets` tables (canonical). Rails: `TestNestedAttributesOnAHasOneAssociation` (nested_attributes_test.rb ~line 250).

PR #3604 canonicalized cid*\*/cr*\* tables; the makeModels() blocks remain.

## Acceptance criteria

- Convert `TestNestedAttributesOnAHasOneAssociation` (lines 566–875) to use canonical `Pirate`/`Ship` imported from test-helpers/models, calling `acceptsNestedAttributesFor` per test to configure the option under test.
- Drop bespoke `PolyOwner`/`PolyTarget` inline classes; use canonical `Owner` (polymorphic target) or the canonical poly models if they exist, or keep inline only for the single polymorphic-build-error test (which is inherently non-canonical).
- No bespoke class declarations with canonical table names in this describe block.
- Test names verbatim. No regressions in test:compare for nested_attributes_test.rb.
- 500 LOC ceiling (PR from main, non-overlapping with sibling PRs).
