---
title: "activerecord: restore the 30 dropped Rails branches in connection-adapters part 1 (report-arms missing rows)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=missing` (RFC 0113; `if`/`loop`/`try`/
`rescue` are report-only, only `throw` is gated). A missing arm is a Rails branch the port does not take —
9 in 10 are real (RFC 0113's stratified read). The connection-adapters pairs:

- `connection-adapters/abstract-adapter.ts#setLockThread` — `-if`
- `connection-adapters/abstract-adapter.ts#withRawConnection` — `-if -if +loop`
- `connection-adapters/abstract-mysql-adapter.ts#buildChangeColumnDefaultDefinition` — `-if`
- `connection-adapters/abstract-mysql-adapter.ts#tableOptions` — `-if -if -if`
- `connection-adapters/abstract-mysql-adapter.ts#mismatchedForeignKeyDetails` — `-if`
- `connection-adapters/abstract/connection-handler.ts#clearActiveConnectionsBang` — `-loop`
- `connection-adapters/abstract/connection-handler.ts#clearReloadableConnectionsBang` — `-loop`
- `connection-adapters/abstract/connection-handler.ts#clearAllConnectionsBang` — `-loop`
- `connection-adapters/abstract/connection-handler.ts#flushIdleConnectionsBang` — `-loop`
- `connection-adapters/abstract/connection-handler.ts#retrieveConnectionPool` — `-if -if`
- `connection-adapters/abstract/connection-pool.ts#clearReloadableConnections` — `-loop`
- `connection-adapters/abstract/connection-pool.ts#flush` — `-if -if -loop -loop`
- `connection-adapters/abstract/connection-pool.ts#removeConnectionFromThreadCache` — `-if`
- `connection-adapters/abstract/database-statements.ts#buildFixtureStatements` — `-if`
- `connection-adapters/abstract/quoting.ts#quotedDate` — `-if`
- `connection-adapters/abstract/schema-creation.ts#visitTableDefinition` — `-loop -if -if`
- `connection-adapters/abstract/schema-statements.ts#columnExists` — `-try -rescue +if`
- `connection-adapters/abstract/schema-statements.ts#buildAddColumnDefinition` — `-if`
- `connection-adapters/abstract/schema-statements.ts#quotedColumnsForIndex` — `-loop`
- `connection-adapters/abstract/schema-statements.ts#bulkChangeTable` — `-loop +if`
- `connection-adapters/abstract/transaction.ts#beforeCommitRecords` — `-loop +if +if`
- `connection-adapters/abstract/transaction.ts#beginTransaction` — `-if -if -if -if`
- `connection-adapters/abstract/transaction.ts#commitTransaction` — `-try -if`
- `connection-adapters/abstract/transaction.ts#rollbackTransaction` — `-try -if`
- `connection-adapters/abstract/transaction.ts#withinNewTransaction` — `-rescue -if -if`
- `connection-adapters/column.ts#deduplicated` — `-if -if -if -if`
- `connection-adapters/mysql/explain-pretty-printer.ts#computeColumnWidths` — `-loop`
- `connection-adapters/mysql/explain-pretty-printer.ts#buildCells` — `-loop`
- `connection-adapters/mysql2-adapter.ts#errorNumber` — `-if`
- `connection-adapters/mysql2-adapter.ts#active` — `-if +try +rescue`

## Acceptance criteria

- [ ] Each pair's branches match its Rails body (CLAUDE.md § "Control flow"): same guards, order, early returns.
- [ ] The missing-direction report shows 0 activerecord rows in these files.
- [ ] Tests exercising the restored branches are ported or already green.
