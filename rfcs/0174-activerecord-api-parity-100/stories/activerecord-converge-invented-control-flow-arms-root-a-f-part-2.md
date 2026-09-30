---
title: "activerecord: remove or credit the 76 invented branches in root-a-f part 2"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-root"]
deps-rfc: []
est-loc: 536
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

- `autosave-association.ts#_ensureNoDuplicateErrors` — `+if`
- `autosave-association.ts#defineNonCyclicMethod` — `+if +if +if +rescue +throw +if +throw`
- `autosave-association.ts#addAutosaveAssociationCallbacks` — `+if +if`
- `autosave-association.ts#defineAutosaveValidationCallbacks` — `+if +if +if +if +if`
- `autosave-association.ts#build` — `+if`
- `base.ts#constructor` — `+if +if +if +try +if +if +if +if +if`
- `connection-handling.ts#connectedToMany` — `+throw +if +throw +if +throw +if +throw +rescue +throw`
- `connection-handling.ts#connectedToAllShards` — `+loop +if +loop`
- `connection-handling.ts#prohibitShardSwapping` — `+rescue +throw`
- `connection-handling.ts#withConnection` — `+try +rescue`
- `connection-handling.ts#connectionSpecificationName` — `+if`
- `connection-handling.ts#clearCacheBang` — `+if`
- `connection-handling.ts#withRoleAndShard` — `+rescue +throw +if`
- `base.ts#constructor` — `+if +if +if +try +if +if +if +if +if`
- `core.ts#initWithAttributes` — `+loop`
- `core.ts#initAttributes` — `+if`
- `core.ts#equals` — `+if +if +if +if +if`
- `core.ts#compare` — `+if`
- `core.ts#inspectionFilter` — `+if +if`
- `core.ts#connectionClass` — `+if`
- `core.ts#connectionClassForSelf` — `+if`
- `core.ts#find` — `+if`
- `core.ts#generatedAssociationMethods` — `+if +if`
- `core.ts#filterAttributes` — `+if +if`
- `core.ts#predicateBuilder` — `+if`
- `core.ts#cachedFindByStatement` — `+if +if +if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
