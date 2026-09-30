---
title: "activerecord: remove or credit the 76 invented branches in tasks part 1"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-subsystems"]
deps-rfc: []
est-loc: 536
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

- `tasks/database-tasks.ts#dbDir` — `+if +if`
- `tasks/database-tasks.ts#root` — `+if +if`
- `tasks/database-tasks.ts#env` — `+if`
- `tasks/database-tasks.ts#create` — `-rescue +if`
- `tasks/database-tasks.ts#prepareAll` — `+if +if +if`
- `tasks/database-tasks.ts#drop` — `-rescue +if`
- `tasks/database-tasks.ts#migrateAll` — `+if +if`
- `tasks/database-tasks.ts#migrate` — `+if +if +if +if`
- `tasks/database-tasks.ts#targetVersion` — `+if`
- `tasks/database-tasks.ts#charsetCurrent` — `+if`
- `tasks/database-tasks.ts#charset` — `+if +throw`
- `tasks/database-tasks.ts#collationCurrent` — `+if`
- `tasks/database-tasks.ts#collation` — `+if +throw`
- `tasks/database-tasks.ts#purge` — `+if`
- `tasks/database-tasks.ts#structureDump` — `+if +throw`
- `tasks/database-tasks.ts#structureLoad` — `+if +throw`
- `tasks/database-tasks.ts#loadSchema` — `+if +throw`
- `tasks/database-tasks.ts#schemaUpToDate` — `+if`
- `tasks/database-tasks.ts#reconstructFromSchema` — `+if +throw`
- `tasks/database-tasks.ts#withTemporaryPoolForEach` — `+if`
- `tasks/database-tasks.ts#classForAdapter` — `-loop +if`
- `tasks/database-tasks.ts#eachCurrentConfiguration` — `+if`
- `tasks/database-tasks.ts#structureDumpFlagsFor` — `+if`
- `tasks/database-tasks.ts#structureLoadFlagsFor` — `+if`
- `tasks/database-tasks.ts#checkCurrentProtectedEnvironmentBang` — `+throw`
- `tasks/database-tasks.ts#initializeDatabase` — `+loop +throw +if`
- `tasks/mysql-database-tasks.ts#structureDump` — `-loop -loop -loop -loop +if +if`
- `tasks/mysql-database-tasks.ts#structureLoad` — `+if`
- `tasks/mysql-database-tasks.ts#runCmd` — `+if +if +if +if +if +throw +if`
- `tasks/postgresql-database-tasks.ts#structureDump` — `-loop +if +if +if`
- `tasks/postgresql-database-tasks.ts#structureLoad` — `+if +if`
- `tasks/postgresql-database-tasks.ts#runCmd` — `+if +if +if +if +if +throw +if`
- `tasks/sqlite-database-tasks.ts#drop` — `+if +throw`
- `tasks/sqlite-database-tasks.ts#purge` — `+if +throw`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
