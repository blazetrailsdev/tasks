---
title: "activerecord: remove or credit the 80 invented branches in associations part 5"
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

- `associations/preloader/branch.ts#preloadersForReflection` — `+loop +if +if +if`
- `associations/preloader/branch.ts#loaders` — `+if`
- `associations/preloader/branch.ts#buildChildren` — `+if +if +if`
- `associations/preloader/through-association.ts#preloadedRecords` — `+if +loop`
- `associations/preloader/through-association.ts#recordsByOwner` — `-loop +if`
- `associations/preloader/through-association.ts#runnableLoaders` — `+loop +loop`
- `associations/preloader/through-association.ts#futureClasses` — `+try +loop +if +try +rescue +rescue +if`
- `associations/preloader/through-association.ts#sourcePreloaders` — `+if +if`
- `associations/preloader/through-association.ts#throughPreloaders` — `+if +if`
- `associations/preloader/through-association.ts#throughReflection` — `+if +if`
- `associations/preloader/through-association.ts#sourceReflection` — `+if +if +if +if +try +rescue +if +loop +if +loop +if`
- `associations/preloader/through-association.ts#sourceRecordsByOwner` — `+if +loop`
- `associations/preloader/through-association.ts#throughRecordsByOwner` — `+if +loop`
- `associations/preloader/through-association.ts#preloadIndex` — `+if`
- `associations/preloader/through-association.ts#throughScope` — `+try +rescue +if +if +if`
- `associations/singular-association.ts#reader` — `+if`
- `associations/singular-association.ts#build` — `+if +if +if +if +if`
- `associations/singular-association.ts#scopeForCreate` — `+if +loop +if`
- `associations/singular-association.ts#findTarget` — `+throw +if +if +if +if +loop +if +if +if`
- `associations/singular-association.ts#_createRecord` — `+if +if +if`
- `associations/through-association.ts#throughReflection` — `+if +if`
- `associations/through-association.ts#throughAssociation` — `+if`
- `associations/through-association.ts#constructJoinAttributes` — `+if +if +if +if +if`
- `associations/has-many-through-association.ts#buildRecord` — `+try +if +if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
