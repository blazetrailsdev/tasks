---
title: "activerecord: remove or credit the 80 invented branches in root-g-p part 1"
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

- `inheritance.ts#ensureProperType` — `+if`
- `inheritance.ts#isDescendsFromActiveRecord` — `+if +if`
- `inheritance.ts#isBaseClass` — `+if`
- `inheritance.ts#stiName` — `+if`
- `inheritance.ts#stiClassFor` — `+if +throw`
- `inheritance.ts#discriminateClassForRecord` — `+if`
- `inheritance.ts#usingSingleTableInheritance` — `+if +if`
- `inheritance.ts#subclassFromAttributes` — `+if +if +if +if`
- `insert-all.ts#returning` — `+if +if`
- `insert-all.ts#mapKeyWithValue` — `+if +loop +if`
- `insert-all.ts#hasAttributeAliases` — `+if`
- `insert-all.ts#resolveAttributeAliases` — `+loop +if +if`
- `insert-all.ts#configureOnDuplicateUpdateLogic` — `+throw +if +if`
- `insert-all.ts#findUniqueIndexFor` — `+if +if +if +if +if +if +if`
- `insert-all.ts#uniqueByColumns` — `+if +if`
- `insert-all.ts#timestampsForCreate` — `+loop`
- `insert-all.ts#extractTypesFromColumnsOn` — `+loop`
- `integration.ts#toParam` — `+if`
- `integration.ts#cacheKey` — `+if +if`
- `integration.ts#cacheVersion` — `+if`
- `integration.ts#canUseFastCacheVersion` — `+if +if +if +if`
- `internal-metadata.ts#set` — `+throw`
- `internal-metadata.ts#get` — `+if`
- `internal-metadata.ts#tableExists` — `+if +throw`
- `log-subscriber.ts#renderBind` — `+if +if +if`
- `log-subscriber.ts#debug` — `+if +if`
- `log-subscriber.ts#logQuerySource` — `+if`
- `log-subscriber.ts#querySourceLocation` — `+loop`
- `migration.ts#detailedMigrationMessage` — `+if`
- `migration.ts#revert` — `+if +if`
- `migration.ts#reversible` — `+if +loop`
- `migration.ts#copy` — `+throw +if +if`
- `migration.ts#nextMigrationNumber` — `+if +if +if +if +if +if`
- `migration.ts#loadMigration` — `-try -rescue +if +throw`
- `migration.ts#migrationsStatus` — `+if +if`
- `migration.ts#migrationFiles` — `+loop +if +if`
- `migration.ts#parseMigrationFilename` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
