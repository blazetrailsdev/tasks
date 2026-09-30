---
title: "activerecord: remove or credit the 73 invented branches in subsystems part 2"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-subsystems"]
deps-rfc: []
est-loc: 518
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

- `locking/optimistic.ts#destroyRow` — `+if`
- `locking/pessimistic.ts#withLock` — `+if +if +if +if +if +if +throw`
- `migration/command-recorder.ts#changeTable` — `+if +throw +if`
- `migration/command-recorder.ts#replay` — `+if +if`
- `migration/command-recorder.ts#invertRemoveIndex` — `+if +if`
- `migration/command-recorder.ts#invertRemoveForeignKey` — `+if +if`
- `migration/command-recorder.ts#invertAddUniqueConstraint` — `+if`
- `migration/command-recorder.ts#invertRemoveUniqueConstraint` — `+if`
- `migration/command-recorder.ts#invertDropEnum` — `+if`
- `migration/command-recorder.ts#invertDropVirtualTable` — `+if`
- `migration/compatibility.ts#createJoinTable` — `+if`
- `migration/compatibility.ts#removeIndex` — `+if`
- `migration/compatibility.ts#find` — `+if`
- `trailties/job-runtime.ts#instrument` — `+if`
- `scoping/default.ts#buildDefaultScope` — `+try +loop`
- `scoping/named.ts#defaultScoped` — `+if +if`
- `testing/query-assertions.ts#assertQueriesMatch` — `+if +if`
- `type/adapter-specific-registry.ts#findRegistration` — `+if +if`
- `type/decimal-without-scale.ts#typeCastForSchema` — `+if`
- `type/hash-lookup-type-map.ts#fetch` — `+if +loop +if +if +if +if +if +try +rescue +if +if +if`
- `type/hash-lookup-type-map.ts#performFetch` — `+if +if`
- `type/serialized.ts#deserialize` — `+if`
- `type/serialized.ts#serialize` — `+if`
- `type/type-map.ts#fetch` — `+if`
- `type/type-map.ts#performFetch` — `-loop +if +if`
- `validations/associated.ts#validateEach` — `+loop +if`
- `validations/uniqueness.ts#constructor` — `+if +try +rescue +if +throw +if`
- `validations/uniqueness.ts#validateEach` — `+if +if +if +if +if +if +if +if`
- `validations/uniqueness.ts#findFinderClassFor` — `+loop +if +if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
