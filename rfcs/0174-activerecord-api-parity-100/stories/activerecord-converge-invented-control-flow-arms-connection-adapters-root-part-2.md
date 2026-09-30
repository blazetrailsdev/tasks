---
title: "activerecord: remove or credit the 80 invented branches in connection-adapters-root part 2"
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

- `connection-adapters/mysql2-adapter.ts#newClient` — `+if +if +throw +if +try +rescue +try +throw`
- `connection-adapters/pool-config.ts#schemaReflection` — `+if`
- `connection-adapters/pool-config.ts#serverVersion` — `+if +try +if +try +if`
- `connection-adapters/pool-config.ts#pool` — `+if`
- `connection-adapters/pool-config.ts#discardPoolsBang` — `+if`
- `connection-adapters/pool-config.ts#disconnectAllBang` — `+if`
- `connection-adapters/pool-manager.ts#constructor` — `+if`
- `connection-adapters/pool-manager.ts#eachPoolConfig` — `+if +throw +if`
- `connection-adapters/pool-manager.ts#removeRole` — `+if`
- `connection-adapters/postgresql-adapter.ts#disconnectBang` — `-rescue +if`
- `connection-adapters/postgresql-adapter.ts#discardBang` — `-try -rescue +if`
- `connection-adapters/postgresql-adapter.ts#dropEnum` — `+if`
- `connection-adapters/postgresql-adapter.ts#renameEnum` — `+if +if +if`
- `connection-adapters/postgresql-adapter.ts#renameEnumValue` — `+if +if`
- `connection-adapters/postgresql-adapter.ts#sessionAuth` — `+if`
- `connection-adapters/postgresql-adapter.ts#extractValueFromDefault` — `+if`
- `connection-adapters/postgresql-adapter.ts#translateException` — `+if +if`
- `connection-adapters/postgresql-adapter.ts#loadAdditionalTypes` — `+loop`
- `connection-adapters/postgresql-adapter.ts#loadTypesQueries` — `+if +throw`
- `connection-adapters/postgresql-adapter.ts#isCachedPlanFailure` — `-try -rescue +if +if`
- `connection-adapters/postgresql-adapter.ts#connect` — `+throw`
- `connection-adapters/postgresql-adapter.ts#configureConnection` — `+loop`
- `connection-adapters/postgresql-adapter.ts#removeIndex` — `+if`
- `connection-adapters/postgresql-adapter.ts#addIndexOptions` — `+if`
- `connection-adapters/postgresql-adapter.ts#newClient` — `+try +if`
- `connection-adapters/postgresql-adapter.ts#removeIndex` — `+if`
- `connection-adapters/postgresql-adapter.ts#addIndexOptions` — `+if`
- `connection-adapters/schema-cache.ts#cache` — `+if +if +if`
- `connection-adapters/schema-cache.ts#possibleCacheAvailable` — `+if +if +try +rescue`
- `connection-adapters/schema-cache.ts#loadCache` — `+if +if +throw`
- `connection-adapters/schema-cache.ts#_loadFrom` — `-if -if +try +rescue`
- `connection-adapters/sqlite3-adapter.ts#constructor` — `+throw`
- `connection-adapters/sqlite3-adapter.ts#encoding` — `+if +if`
- `connection-adapters/sqlite3-adapter.ts#removeIndex` — `+if`
- `connection-adapters/sqlite3-adapter.ts#removeColumn` — `+if +throw`
- `connection-adapters/sqlite3-adapter.ts#foreignKeys` — `+if +if +loop +if +loop +if`
- `connection-adapters/sqlite3-adapter.ts#extractValueFromDefault` — `+if`
- `connection-adapters/sqlite3-adapter.ts#translateException` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
