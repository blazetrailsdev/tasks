---
title: "activerecord: remove or credit the 80 invented branches in connection-adapters-abstract part 2"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-connection-adapters-part-1"]
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

- `connection-adapters/abstract/query-cache.ts#checkoutAndVerify` — `+if`
- `connection-adapters/abstract/query-cache.ts#disableQueryCache` — `+rescue +throw +if`
- `connection-adapters/abstract/query-cache.ts#enableQueryCache` — `+rescue +throw +if`
- `connection-adapters/abstract/quoting.ts#quote` — `+if +if +if +throw +if +throw`
- `connection-adapters/abstract/quoting.ts#typeCast` — `+if +if +if +if +if +throw`
- `connection-adapters/abstract/quoting.ts#quoteColumnName` — `+throw`
- `connection-adapters/abstract/schema-creation.ts#accept` — `+if`
- `connection-adapters/abstract/schema-creation.ts#visitAlterTable` — `+loop +loop +loop +loop`
- `connection-adapters/abstract/schema-definitions.ts#conditionalOptions` — `+if +if`
- `connection-adapters/abstract/schema-definitions.ts#polymorphicOptions` — `+if +if +if`
- `connection-adapters/abstract/schema-definitions.ts#setPrimaryKey` — `+if +if`
- `connection-adapters/abstract/schema-definitions.ts#columnExists` — `+if`
- `connection-adapters/abstract/schema-definitions.ts#indexExists` — `+if`
- `connection-adapters/abstract/schema-definitions.ts#remove` — `+if +if`
- `connection-adapters/abstract/schema-definitions.ts#removeIndex` — `+if +if +if`
- `connection-adapters/abstract/schema-definitions.ts#removeTimestamps` — `+if`
- `connection-adapters/abstract/schema-definitions.ts#removeReferences` — `+if`
- `connection-adapters/abstract/schema-definitions.ts#removeForeignKey` — `+if +if`
- `connection-adapters/abstract/schema-definitions.ts#foreignKeyExists` — `+if +if`
- `connection-adapters/abstract/schema-definitions.ts#removeCheckConstraint` — `+if +if`
- `connection-adapters/abstract/schema-definitions.ts#checkConstraintExists` — `+if +if`
- `connection-adapters/abstract/schema-definitions.ts#raiseOnIfExistOptions` — `+if`
- `connection-adapters/abstract/schema-dumper.ts#prepareColumnOptions` — `+if +if +if +if`
- `connection-adapters/abstract/schema-dumper.ts#schemaLimit` — `+if`
- `connection-adapters/abstract/schema-statements.ts#dataSources` — `+if +throw`
- `connection-adapters/abstract/schema-statements.ts#dataSourceExists` — `+if +throw`
- `connection-adapters/abstract/schema-statements.ts#tableExists` — `+if +throw`
- `connection-adapters/abstract/schema-statements.ts#viewExists` — `+throw`
- `connection-adapters/abstract/schema-statements.ts#columns` — `+loop`
- `connection-adapters/abstract/schema-statements.ts#columnExists` — `-try -rescue +if`
- `connection-adapters/abstract/schema-statements.ts#createTable` — `+if +if`
- `connection-adapters/abstract/schema-statements.ts#buildCreateTableDefinition` — `+loop +loop +if +if`
- `connection-adapters/abstract/schema-statements.ts#createJoinTable` — `+if`
- `connection-adapters/abstract/schema-statements.ts#changeTable` — `+if +if +if +if`
- `connection-adapters/abstract/schema-statements.ts#dropTable` — `+if +if +loop`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
