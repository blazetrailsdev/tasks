---
title: "activerecord: remove or credit the 80 invented branches in associations part 1"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-associations"]
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

- `associations/alias-tracker.ts#aliasedTableFor` — `+if`
- `associations/alias-tracker.ts#create` — `+if +if`
- `associations/alias-tracker.ts#initialCountFor` — `+loop +if +if +if`
- `associations/association-scope.ts#nextChainScope` — `+if`
- `associations/association-scope.ts#addConstraints` — `+loop +if +if +if +if +if +if`
- `associations/association-scope.ts#applyScope` — `+loop`
- `associations/association-scope.ts#getBindValues` — `+if +if +loop +if +if`
- `associations/association.ts#reload` — `+if +if`
- `associations/association.ts#scope` — `+if +if +if +if`
- `associations/association.ts#setStrictLoading` — `+if`
- `associations/association.ts#removeInverseInstance` — `+if +if`
- `associations/association.ts#loadTarget` — `-try -rescue +if`
- `associations/association.ts#marshalLoad` — `-loop +if`
- `associations/association.ts#createBang` — `+if +throw`
- `associations/association.ts#skipStrictLoading` — `+rescue +throw +if`
- `associations/association.ts#associationScope` — `+if +if`
- `associations/association.ts#targetScope` — `+if +if`
- `associations/association.ts#raiseOnTypeMismatchBang` — `+if`
- `associations/association.ts#inverseAssociationFor` — `+if +if +if +try +rescue`
- `associations/association.ts#buildRecord` — `+if +if`
- `associations/association.ts#inversable` — `+if`
- `associations/belongs-to-association.ts#handleDependency` — `+if +if +if +if +if +if`
- `associations/belongs-to-association.ts#inversedFrom` — `+if`
- `associations/belongs-to-association.ts#decrementCountersBeforeLastSave` — `+try +rescue +if`
- `associations/belongs-to-association.ts#updateCounters` — `+if`
- `associations/belongs-to-association.ts#replaceKeys` — `+if`
- `associations/belongs-to-association.ts#foreignKeyPresent` — `+if`
- `associations/belongs-to-association.ts#isInvertibleFor` — `+if +if`
- `associations/belongs-to-association.ts#staleState` — `+if +if +throw`
- `associations/belongs-to-polymorphic-association.ts#klass` — `+if`
- `associations/belongs-to-polymorphic-association.ts#replaceKeys` — `+if +if`
- `associations/belongs-to-polymorphic-association.ts#inverseReflectionFor` — `+if`
- `associations/builder/association.ts#build` — `+if`
- `associations/builder/association.ts#createReflection` — `+if +if`
- `associations/builder/association.ts#validOptions` — `+if`
- `associations/builder/association.ts#defineCallbacks` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
