---
title: "Canonicalize TestNestedAttributesOnABelongsToAssociation makeModels() block"
status: claimed
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-06-19T12:24:25Z"
assignee: "canonicalize-nested-belongs-to-block"
blocked-by: null
---

## Context

`packages/activerecord/src/nested-attributes.test.ts` lines 876–1115: `TestNestedAttributesOnABelongsToAssociation`. Uses a local `makeModels()` factory that creates fresh `class Ship` / `class Pirate` on canonical `ships`/`pirates` tables with varying `acceptsNestedAttributesFor` options. Rails: `TestNestedAttributesOnABelongsToAssociation` (nested_attributes_test.rb).

## Acceptance criteria

- Convert `TestNestedAttributesOnABelongsToAssociation` (lines 876–1115) to use canonical `Ship`/`Pirate`, calling `acceptsNestedAttributesFor` per test.
- No bespoke class declarations with canonical table names.
- Test names verbatim. No regressions in test:compare.
- 500 LOC ceiling, PR from main.
