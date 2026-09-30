---
title: "activerecord: remove or credit the 80 invented branches in subsystems part 1"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-subsystems"]
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

- `attribute-methods/primary-key.ts#toKey` — `+if`
- `attribute-methods/primary-key.ts#getPrimaryKey` — `+try +if +rescue`
- `attribute-methods/serialization.ts#constructor` — `+if`
- `attribute-methods/serialization.ts#serialize` — `+if +if`
- `attribute-methods/serialization.ts#isTypeIncompatibleWithSerialize` — `+if +if +if`
- `attribute-methods/time-zone-conversion.ts#cast` — `-try -rescue +if +if +if +if +if +if`
- `attribute-methods/write.ts#writeAttribute` — `+if +if +throw`
- `coders/column-serializer.ts#assertValidValue` — `+if +if`
- `coders/column-serializer.ts#checkArityOfConstructor` — `+if +throw`
- `coders/json.ts#load` — `+if`
- `database-configurations/connection-url-resolver.ts#constructor` — `+if +throw +if +if +if +if +try +if +rescue +throw +if +if +if`
- `database-configurations/connection-url-resolver.ts#toHash` — `+loop +loop +if +try +rescue`
- `database-configurations/connection-url-resolver.ts#queryHash` — `+if`
- `database-configurations/connection-url-resolver.ts#rawConfig` — `+if +if +if`
- `database-configurations/connection-url-resolver.ts#databaseFromPath` — `+if +if`
- `database-configurations/database-config.ts#adapterClass` — `+if +if`
- `database-configurations/database-config.ts#inspect` — `+if +try`
- `database-configurations/database-config.ts#newConnection` — `+if +try +throw`
- `database-configurations/hash-config.ts#reapingFrequency` — `+if`
- `database-configurations/hash-config.ts#schemaDump` — `+if`
- `fixture-set/file.ts#each` — `+if`
- `fixture-set/file.ts#configRow` — `+if`
- `fixture-set/file.ts#rawRows` — `+if +if +if +throw +if`
- `fixture-set/model-metadata.ts#columnType` — `+if`
- `fixture-set/render-context.ts#createSubclass` — `+loop +loop +if +if +if`
- `fixture-set/table-row.ts#resolveEnums` — `+if`
- `fixture-set/table-row.ts#resolveStiReflections` — `+if +if`
- `fixture-set/table-row.ts#addJoinRecords` — `-loop +if`
- `fixture-set/table-rows.ts#toHash` — `+loop +if`
- `locking/optimistic.ts#_createRecord` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
