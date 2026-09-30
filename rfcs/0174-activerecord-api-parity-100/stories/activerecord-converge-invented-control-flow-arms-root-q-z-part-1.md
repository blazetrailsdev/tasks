---
title: "activerecord: remove or credit the 79 invented branches in root-q-z part 1"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-root"]
deps-rfc: []
est-loc: 554
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

- `query-logs.ts#querySourceLocation` — `+loop +if +if`
- `query-logs.ts#rebuildHandlers` — `+if +if`
- `query-logs.ts#buildHandler` — `+if`
- `query-logs.ts#tagContent` — `+if +if`
- `reflection.ts#joinScope` — `+throw +loop +if`
- `reflection.ts#klassJoinScope` — `+if`
- `reflection.ts#counterCacheColumn` — `+if +try +if +if +throw +if +if +if +rescue`
- `reflection.ts#inverseWhichUpdatesCounterCache` — `-if +try +rescue`
- `reflection.ts#isInverseUpdatesCounterInMemory` — `+if +if`
- `reflection.ts#hasCachedCounter` — `+if +if +if`
- `reflection.ts#hasActiveCachedCounter` — `+if +if`
- `reflection.ts#strictLoadingViolationMessage` — `+if`
- `reflection.ts#primaryKey` — `+if`
- `reflection.ts#_klass` — `+throw`
- `reflection.ts#equals` — `+if +if`
- `reflection.ts#normalizeOptions` — `+if +if +if`
- `reflection.ts#mapping` — `+if +if +if`
- `reflection.ts#automaticInverseOf` — `+loop +loop +if +if +if`
- `reflection.ts#validInverseReflection` — `+if +if +if +if +loop +if +if`
- `reflection.ts#scopeAllowsAutomaticInverseOf` — `+if +try +rescue`
- `reflection.ts#deriveForeignKey` — `+if`
- `reflection.ts#deriveFkQueryConstraints` — `+if +if`
- `reflection.ts#sourceReflectionName` — `+if +if`
- `reflection.ts#collectJoinReflections` — `+if +if +if`
- `relation.ts#constructor` — `+if +if +if +if +if +if +if +if +if +if +if`
- `relation.ts#initializeCopy` — `+loop`
- `relation.ts#create` — `+loop`
- `relation.ts#createBang` — `+loop`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
