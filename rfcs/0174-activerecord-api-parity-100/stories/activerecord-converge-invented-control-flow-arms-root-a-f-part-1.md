---
title: "activerecord: remove or credit the 80 invented branches in root-a-f part 1"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-root"]
deps-rfc: []
est-loc: 560
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=invented` — branches the TS body takes
that Rails' does not. RFC 0113 measured the `if` token ~70% non-real at repo scale (type narrowing,
`?.`, argument normalisation), so each row is either a real invented guard to delete (CLAUDE.md
§ "No extra abstraction", § "Control flow") or an extractor false positive to fix with a test:

- `aggregations.ts#composedOf` — `+if`
- `association-relation.ts#equals` — `+if +if`
- `associations.ts#hasAndBelongsToMany` — `+if +if`
- `asynchronous-queries-tracker.ts#currentSession` — `+if`
- `attribute-assignment.ts#_assignAttributes` — `+if +if +if`
- `attribute-assignment.ts#assignNestedParameterAttributes` — `+if`
- `attribute-assignment.ts#typeCastAttributeValue` — `+if +if +if +if`
- `attribute-assignment.ts#findParameterPosition` — `+if`
- `attribute-methods.ts#attributes` — `+loop`
- `attribute-methods.ts#attributesWithValues` — `+if +loop +if`
- `attribute-methods.ts#attributesForUpdate` — `+if +if +if +if`
- `attribute-methods.ts#attributesForCreate` — `+if +if +if`
- `attribute-methods.ts#formatForInspect` — `+if +if +if +if +if +if +try +if +rescue +if`
- `attribute-methods.ts#dangerousAttributeMethods` — `+if`
- `attribute-methods.ts#initializeGeneratedModules` — `+if +if`
- `attribute-methods.ts#aliasAttribute` — `+if`
- `attribute-methods.ts#defineAttributeMethods` — `+if`
- `attribute-methods.ts#generateAliasAttributes` — `+if`
- `attribute-methods.ts#isInstanceMethodAlreadyImplemented` — `+if`
- `attribute-methods.ts#isDangerousClassMethod` — `+loop`
- `attributes.ts#_defaultAttributes` — `+if +loop +try`
- `autosave-association.ts#associatedRecordsToValidateOrSave` — `+if +if`
- `autosave-association.ts#isNestedRecordsChangedForAutosave` — `+loop +if +if +if`
- `autosave-association.ts#validateHasOneAssociation` — `+if +if`
- `autosave-association.ts#validateBelongsToAssociation` — `+if`
- `autosave-association.ts#aroundSaveCollectionAssociation` — `+if +rescue +throw +if +throw`
- `autosave-association.ts#saveHasOneAssociation` — `+if +if +if +if +if`
- `autosave-association.ts#is_recordChanged` — `+if +if +if`
- `autosave-association.ts#isAssociationForeignKeyChanged` — `+if +if`
- `autosave-association.ts#isInversePolymorphicAssociationChanged` — `+if`
- `autosave-association.ts#saveBelongsToAssociation` — `+if +if +if +if +if +if`
- `autosave-association.ts#computePrimaryKey` — `+if +if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
