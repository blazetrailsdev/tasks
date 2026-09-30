---
title: "activerecord: remove or credit the 77 invented branches in root-g-p part 2"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-root"]
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

- `migration.ts#move` — `+if`
- `migration.ts#runnable` — `+loop +if +loop +if`
- `migration.ts#recordEnvironment` — `+if`
- `migration.ts#executeMigrationInTransaction` — `+if`
- `migration.ts#isUseTransaction` — `+if`
- `migration.ts#withAdvisoryLock` — `+rescue +try +rescue +throw +if +throw +if +throw`
- `model-schema.ts#tableName` — `+if +if +if +if +try +if`
- `model-schema.ts#ignoredColumns` — `+if`
- `model-schema.ts#sequenceName` — `+if +if +if`
- `model-schema.ts#attributesBuilder` — `+if`
- `model-schema.ts#columnsHash` — `+if +try +rescue +if +if +loop +if`
- `model-schema.ts#columns` — `+if`
- `model-schema.ts#_returningColumnsForInsert` — `+if +if +if`
- `model-schema.ts#yamlEncoder` — `+if`
- `model-schema.ts#columnNames` — `+if +if +if`
- `model-schema.ts#symbolColumnToString` — `+if`
- `model-schema.ts#contentColumns` — `+if +if +if`
- `model-schema.ts#resetColumnInformation` — `-loop +try +rescue`
- `nested-attributes.ts#assignNestedAttributesForOneToOneAssociation` — `+if +if +if +if +if +if`
- `nested-attributes.ts#assignToOrMarkForDestruction` — `+if`
- `nested-attributes.ts#findRecordById` — `+if +if`
- `nested-attributes.ts#generateAssociationWriter` — `+if +loop`
- `persistence.ts#save` — `+if +if +try +if +if +throw +if +if +if +throw`
- `persistence.ts#saveBang` — `+if +if`
- `persistence.ts#destroy` — `+throw +if +try +if`
- `persistence.ts#destroyBang` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
