---
title: "activerecord: remove or credit the 79 invented branches in associations part 2"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-associations"]
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

- `associations/builder/association.ts#addDestroyCallbacks` — `+try +rescue +throw +throw`
- `associations/builder/belongs-to.ts#defineCallbacks` — `+loop +if +if`
- `associations/builder/belongs-to.ts#addCounterCacheCallbacks` — `+if +if +if +if`
- `associations/builder/belongs-to.ts#touchRecord` — `+if +if +try +if +rescue +if +if +if +if +if +if +if`
- `associations/builder/belongs-to.ts#addTouchCallbacks` — `+if +if +if +if +if +try`
- `associations/builder/belongs-to.ts#addDefaultCallbacks` — `+if +if +if`
- `associations/builder/belongs-to.ts#defineValidations` — `+if +if +if +if +if +if +if +if`
- `associations/builder/collection-association.ts#defineCallback` — `+if +if +if +if +if +if`
- `associations/builder/has-and-belongs-to-many.ts#throughModel` — `+loop +if +throw +if`
- `associations/builder/has-one.ts#touchRecord` — `+if +if +if +if`
- `associations/builder/has-one.ts#addTouchCallbacks` — `+if +if +if +try`
- `associations/collection-association.ts#reader` — `+if +try`
- `associations/collection-association.ts#idsReader` — `+if +if +if +if +if`
- `associations/collection-association.ts#idsWriter` — `+if +if +if`
- `associations/collection-association.ts#find` — `+if +if +if`
- `associations/collection-association.ts#concat` — `+if`
- `associations/collection-association.ts#deleteAll` — `+if`
- `associations/collection-association.ts#replace` — `+if`
- `associations/collection-association.ts#loadTarget` — `+if +if +if`
- `associations/collection-association.ts#addToTarget` — `+if`
- `associations/collection-association.ts#transaction` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
