---
title: "activerecord: remove or credit the 80 invented branches in root-q-z part 2"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-root"]
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

- `relation.ts#createOrFindBy` — `+throw +if`
- `relation.ts#createOrFindByBang` — `+throw +if`
- `relation.ts#isOne` — `+loop +if +if`
- `relation.ts#isMany` — `+loop +if`
- `relation.ts#cacheKey` — `+if`
- `relation.ts#cacheVersion` — `+if`
- `relation.ts#scoping` — `+if +if`
- `relation.ts#update` — `+throw +if +if`
- `relation.ts#updateBang` — `+throw +if +if`
- `relation.ts#updateCounters` — `+loop +loop`
- `relation.ts#delete` — `+if +if +if +if +loop`
- `relation.ts#loadAsync` — `+try`
- `relation.ts#load` — `+if +if`
- `relation.ts#reset` — `+if`
- `relation.ts#toSql` — `+if`
- `relation.ts#preloadAssociations` — `+if`
- `relation.ts#_scoping` — `+rescue +throw +if +throw`
- `relation.ts#execQueries` — `+if +if +if`
- `relation.ts#referencesEagerLoadedTables` — `+if`
- `relation.ts#tablesInString` — `+if +if`
- `result.ts#last` — `+if +throw +if`
- `result.ts#castValues` — `+if`
- `result.ts#columnIndexes` — `+if`
- `result.ts#indexedRows` — `+if`
- `result.ts#hashRows` — `+if +loop`
- `result.ts#equals` — `+if +if`
- `sanitization.ts#sanitizeSqlForOrder` — `+if +if`
- `sanitization.ts#sanitizeSqlLike` — `+if`
- `sanitization.ts#disallowRawSqlBang` — `+if +if +if`
- `schema-dumper.ts#constructor` — `-try -rescue +if +if`
- `schema-dumper.ts#header` — `+if +if +if`
- `schema-dumper.ts#table` — `-loop +try +try +rescue +if +rescue +if +if`
- `schema-dumper.ts#indexes` — `+if`
- `schema-dumper.ts#indexesInCreate` — `+if`
- `schema-dumper.ts#indexParts` — `+if`
- `schema-dumper.ts#checkConstraintsInCreate` — `+if +if +if +if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
