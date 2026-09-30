---
title: "activerecord: remove or credit the 80 invented branches in associations part 3"
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

- `associations/collection-association.ts#_createRecord` — `+loop +if`
- `associations/collection-association.ts#deleteOrDestroy` — `+if +if +if +if`
- `associations/collection-association.ts#removeRecords` — `+if +if`
- `associations/collection-association.ts#concatRecords` — `+if +loop +if +if +throw`
- `associations/collection-association.ts#replaceOnTarget` — `+if +if`
- `associations/collection-association.ts#isIncludeInMemory` — `+loop +if`
- `associations/collection-proxy.ts#constructor` — `+loop +if`
- `associations/collection-proxy.ts#build` — `+if`
- `associations/collection-proxy.ts#calculate` — `+if`
- `associations/collection-proxy.ts#pluck` — `+if`
- `associations/collection-proxy.ts#inspect` — `+if +if +if`
- `associations/collection-proxy.ts#prettyPrint` — `+if +if +if`
- `associations/disable-joins-association-scope.ts#lastScopeChain` — `+if +throw +if +loop +if`
- `associations/foreign-association.ts#nullifiedOwnerAttributes` — `+if`
- `associations/has-many-association.ts#handleDependency` — `+if +loop +if`
- `associations/has-many-association.ts#deleteRecords` — `+if +if +if +if`
- `associations/has-many-association.ts#concatRecords` — `+if`
- `associations/has-many-through-association.ts#concatRecords` — `+if`
- `associations/has-many-through-association.ts#removeRecords` — `+if +if`
- `associations/has-many-through-association.ts#deleteRecords` — `+if +if +if +if +if`
- `associations/has-one-association.ts#delete` — `+if +if +if +if`
- `associations/has-one-association.ts#replace` — `+if +if +if +if +if +if +if`
- `associations/has-one-association.ts#removeTargetBang` — `+if +if`
- `associations/has-one-association.ts#nullifyOwnerAttributes` — `+if +if +if +if`
- `associations/has-one-association.ts#_createRecord` — `+if +throw`
- `associations/has-one-association.ts#setOwnerAttributes` — `+if +if +if +if`
- `associations/has-one-through-association.ts#replace` — `+if`
- `associations/join-dependency.ts#joinConstraints` — `+if`
- `associations/join-dependency.ts#instantiate` — `-loop +if`
- `associations/join-dependency.ts#aliases` — `-loop -loop +if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
