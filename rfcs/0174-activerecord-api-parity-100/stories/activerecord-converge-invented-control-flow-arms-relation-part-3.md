---
title: "activerecord: remove or credit the 29 invented branches in relation part 3"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-relation"]
deps-rfc: []
est-loc: 254
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

- `relation/query-methods.ts#preprocessOrderArgs` — `+loop +loop +loop +if +if +loop`
- `relation/query-methods.ts#sanitizeOrderArguments` — `+loop`
- `relation/query-methods.ts#columnReferences` — `+loop +if +if +if +if +loop +if +if`
- `relation/query-methods.ts#extractTableNameFrom` — `+if`
- `relation/query-methods.ts#checkIfMethodHasArgumentsBang` — `+loop`
- `relation/query-methods.ts#arelColumnAliasesFromHash` — `+if +if`
- `relation/query-methods.ts#processWithArgs` — `+if +if +if`
- `relation/where-clause.ts#toH` — `+if`
- `relation/where-clause.ts#equals` — `+if`
- `relation/where-clause.ts#isContradiction` — `+loop +if +if`
- `relation/where-clause.ts#referencedColumns` — `+if`
- `relation/where-clause.ts#eachAttributes` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
