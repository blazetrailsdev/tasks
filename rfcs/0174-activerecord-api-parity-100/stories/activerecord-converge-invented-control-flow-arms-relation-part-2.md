---
title: "activerecord: remove or credit the 80 invented branches in relation part 2"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-relation"]
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

- `relation/predicate-builder.ts#expandFromHash` — `-if -if -if -if -if -if -if +loop`
- `relation/predicate-builder.ts#convertDotNotationToHash` — `+if +if`
- `relation/predicate-builder.ts#handlerFor` — `+if +if`
- `relation/predicate-builder.ts#references` — `+if +if`
- `relation/predicate-builder/array-handler.ts#call` — `+if +if +if +if +loop +if`
- `relation/predicate-builder/association-query-value.ts#queries` — `+if +if +throw +if +throw`
- `relation/predicate-builder/association-query-value.ts#ids` — `+if`
- `relation/predicate-builder/association-query-value.ts#isSelectClause` — `+if +if`
- `relation/predicate-builder/association-query-value.ts#isPolymorphicClause` — `+if +if +if`
- `relation/predicate-builder/association-query-value.ts#convertToId` — `+if +if`
- `relation/predicate-builder/polymorphic-array-value.ts#queries` — `+loop +if +loop +if +throw +if +loop +if +if`
- `relation/predicate-builder/polymorphic-array-value.ts#typeToIdsMapping` — `+if`
- `relation/predicate-builder/polymorphic-array-value.ts#convertToId` — `+if +if +if`
- `relation/query-attribute.ts#isUnboundable` — `+if`
- `relation/query-methods.ts#associated` — `+if +if`
- `relation/query-methods.ts#missing` — `+if +if`
- `relation/query-methods.ts#buildSubquery` — `+if +throw +if`
- `relation/query-methods.ts#buildWhereClause` — `+loop +if +if +if +if`
- `relation/query-methods.ts#buildJoinDependencies` — `-if +loop`
- `relation/query-methods.ts#buildFrom` — `+if +try +throw`
- `relation/query-methods.ts#selectNamedJoins` — `+if +loop`
- `relation/query-methods.ts#buildSelect` — `+if`
- `relation/query-methods.ts#buildWithValueFromHash` — `+if`
- `relation/query-methods.ts#buildWithExpressionFromValue` — `+if`
- `relation/query-methods.ts#arelColumnWithTable` — `+if`
- `relation/query-methods.ts#arelColumn` — `+if`
- `relation/query-methods.ts#isTableNameMatches` — `+if +if`
- `relation/query-methods.ts#reverseSqlOrder` — `+if +if +if`
- `relation/query-methods.ts#validateOrderArgs` — `+loop +if +if +throw`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
