---
title: "activerecord: remove or credit the 76 invented branches in relation part 1"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-relation"]
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

- `relation/batches.ts#findEach` — `+loop`
- `relation/batches.ts#findInBatches` — `+loop`
- `relation/batches.ts#inBatches` — `+throw +if +if +loop +if +loop +if +if +if +if +if +if +if +loop`
- `relation/batches.ts#ensureValidOptionsForBatchingBang` — `+if +if +if`
- `relation/batches.ts#batchOnLoadedRelation` — `+if +loop`
- `relation/batches.ts#compareValuesForOrder` — `+if +if`
- `relation/batches.ts#batchOnUnloadedRelation` — `-if -if +loop`
- `relation/batches/batch-enumerator.ts#deleteAll` — `+loop`
- `relation/batches/batch-enumerator.ts#updateAll` — `+loop`
- `relation/batches/batch-enumerator.ts#touchAll` — `+loop +if`
- `relation/batches/batch-enumerator.ts#destroyAll` — `+loop`
- `relation/calculations.ts#count` — `+if +if +throw`
- `relation/calculations.ts#sum` — `+if +if`
- `relation/calculations.ts#pick` — `+if`
- `relation/calculations.ts#ids` — `+if +if`
- `relation/calculations.ts#isAllAttributes` — `+if`
- `relation/calculations.ts#operationOverAggregateColumn` — `+if`
- `relation/calculations.ts#executeGroupedCalculation` — `-loop -loop -loop -loop +if +if +if +if`
- `relation/calculations.ts#lookupCastTypeFromJoinDependencies` — `+if`
- `relation/calculations.ts#typeCastCalculatedValue` — `+if +if +if +if +if +if +if`
- `relation/calculations.ts#selectForCount` — `+if`
- `relation/delegation.ts#generateMethod` — `-if +loop`
- `relation/delegation.ts#uncacheableMethods` — `+if`
- `relation/delegation.ts#relationDelegateClass` — `+if`
- `relation/delegation.ts#generatedRelationMethods` — `+if`
- `relation/merger.ts#mergePreloads` — `+if`
- `relation/merger.ts#mergeJoins` — `+loop +loop +if`
- `relation/merger.ts#mergeOuterJoins` — `+loop +loop +if`
- `relation/predicate-builder.ts#registerHandler` — `+if +throw`
- `relation/predicate-builder.ts#build` — `+if +if +if +if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
