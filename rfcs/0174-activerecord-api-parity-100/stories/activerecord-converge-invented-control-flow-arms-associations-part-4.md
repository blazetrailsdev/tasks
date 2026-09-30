---
title: "activerecord: remove or credit the 77 invented branches in associations part 4"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-associations"]
deps-rfc: []
est-loc: 542
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

- `associations/join-dependency.ts#makeConstraints` — `+if +if +if`
- `associations/join-dependency.ts#walk` — `+if +if`
- `associations/join-dependency.ts#findReflection` — `+if`
- `associations/join-dependency.ts#build` — `+if`
- `associations/join-dependency.ts#construct` — `+if +if +if +if +if`
- `associations/join-dependency.ts#walkTree` — `+loop +if +if +if +try +rescue`
- `associations/join-dependency/join-association.ts#joinConstraints` — `+if +if +if +loop +if +if +if +if +if`
- `associations/nested-error.ts#computeAttribute` — `+if +if`
- `associations/preloader.ts#constructor` — `+if`
- `associations/preloader.ts#isEmpty` — `+if`
- `associations/preloader.ts#loaders` — `+loop`
- `associations/preloader/association.ts#ownersByKey` — `+if +if`
- `associations/preloader/association.ts#isLoaded` — `+try +rescue`
- `associations/preloader/association.ts#targetFor` — `+try +rescue`
- `associations/preloader/association.ts#scope` — `+if`
- `associations/preloader/association.ts#setInverse` — `+try +rescue`
- `associations/preloader/association.ts#associateRecordsFromUnscoped` — `+if +try +if +rescue`
- `associations/preloader/association.ts#associateRecordsToOwner` — `+if`
- `associations/preloader/association.ts#convertKey` — `+if +if +if +if`
- `associations/preloader/association.ts#associationKeyType` — `+if`
- `associations/preloader/association.ts#ownerKeyType` — `+if`
- `associations/preloader/association.ts#hash` — `+if`
- `associations/preloader/association.ts#loadRecordsForKeys` — `+if +if +loop`
- `associations/preloader/association.ts#populateKeysToLoadAndAlreadyLoadedRecords` — `+loop`
- `associations/preloader/batch.ts#call` — `+loop +loop +if +loop +loop +if`
- `associations/preloader/branch.ts#constructor` — `-try -rescue +if +if`
- `associations/preloader/branch.ts#immediateFutureClasses` — `-loop +if`
- `associations/preloader/branch.ts#sourceRecords` — `+if`
- `associations/preloader/branch.ts#preloadedRecords` — `+if +if +throw +loop`
- `associations/preloader/branch.ts#runnableLoaders` — `+if +loop`
- `associations/preloader/branch.ts#groupedRecords` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
