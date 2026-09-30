---
title: "activerecord: remove or credit the 80 invented branches in connection-adapters-abstract part 1"
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

- `connection-adapters/abstract/connection-handler.ts#connectionPoolList` — `+loop +if +loop`
- `connection-adapters/abstract/connection-handler.ts#eachConnectionPool` — `+if +if +loop`
- `connection-adapters/abstract/connection-handler.ts#establishConnection` — `+if +if +if`
- `connection-adapters/abstract/connection-handler.ts#removeConnectionPool` — `+if`
- `connection-adapters/abstract/connection-handler.ts#setPoolManager` — `+if`
- `connection-adapters/abstract/connection-handler.ts#determineOwnerName` — `+if`
- `connection-adapters/abstract/connection-pool.ts#schemaCache` — `+if`
- `connection-adapters/abstract/connection-pool.ts#checkin` — `+if +if`
- `connection-adapters/abstract/connection-pool.ts#remove` — `+if +if`
- `connection-adapters/abstract/connection-pool.ts#migrationsPaths` — `+if`
- `connection-adapters/abstract/connection-pool.ts#leaseConnection` — `+if`
- `connection-adapters/abstract/connection-pool.ts#pinConnectionBang` — `+if +if +if`
- `connection-adapters/abstract/connection-pool.ts#unpinConnectionBang` — `+if +if`
- `connection-adapters/abstract/connection-pool.ts#connections` — `+if`
- `connection-adapters/abstract/connection-pool.ts#disconnect` — `+if`
- `connection-adapters/abstract/connection-pool.ts#newConnection` — `+if +throw +if +if +try +if +if +if +try +if`
- `connection-adapters/abstract/connection-pool.ts#connectionLease` — `+if`
- `connection-adapters/abstract/connection-pool.ts#set` — `+loop +if`
- `connection-adapters/abstract/connection-pool/queue.ts#delete` — `+loop +if`
- `connection-adapters/abstract/connection-pool/queue.ts#waitPoll` — `+loop`
- `connection-adapters/abstract/connection-pool/queue.ts#withABiasFor` — `+rescue +throw +if`
- `connection-adapters/abstract/connection-pool/queue.ts#withABiasFor` — `+rescue +throw +if`
- `connection-adapters/abstract/connection-pool/reaper.ts#registerPool` — `+if +if +if`
- `connection-adapters/abstract/database-statements.ts#cacheableQuery` — `+if`
- `connection-adapters/abstract/database-statements.ts#insert` — `+if`
- `connection-adapters/abstract/database-statements.ts#transaction` — `+if +if +if +try +if +if +throw +rescue +if +throw`
- `connection-adapters/abstract/database-statements.ts#resetTransaction` — `+if +if`
- `connection-adapters/abstract/database-statements.ts#beginDeferredTransaction` — `+if +if`
- `connection-adapters/abstract/database-statements.ts#rollbackDbTransaction` — `+if +if +throw`
- `connection-adapters/abstract/database-statements.ts#restartDbTransaction` — `+if`
- `connection-adapters/abstract/database-statements.ts#rollbackToSavepoint` — `+if`
- `connection-adapters/abstract/database-statements.ts#withYamlFallback` — `+if +if`
- `connection-adapters/abstract/database-statements.ts#buildFixtureSql` — `+if`
- `connection-adapters/abstract/database-statements.ts#select` — `+if`
- `connection-adapters/abstract/database-statements.ts#sqlForInsert` — `+if +if +if`
- `connection-adapters/abstract/query-cache.ts#selectAll` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
