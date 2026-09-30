---
title: "activerecord: remove or credit the 46 invented branches in connection-adapters-mysql-sqlite3"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-connection-adapters-part-1"]
deps-rfc: []
est-loc: 356
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

- `connection-adapters/mysql/database-statements.ts#isWriteQuery` — `+if +throw`
- `connection-adapters/mysql/database-statements.ts#buildExplainClause` — `+if`
- `connection-adapters/mysql/database-statements.ts#isAnalyzeWithoutExplain` — `+if`
- `connection-adapters/mysql/database-statements.ts#isMaxAllowedPacketReached` — `+throw +if`
- `connection-adapters/mysql/explain-pretty-printer.ts#pp` — `+if`
- `connection-adapters/mysql/quoting.ts#castBoundValue` — `+if`
- `connection-adapters/mysql/quoting.ts#quoteColumnName` — `+if`
- `connection-adapters/mysql/quoting.ts#quoteTableName` — `+if`
- `connection-adapters/mysql/schema-creation.ts#visitIndexDefinition` — `+if`
- `connection-adapters/mysql/schema-dumper.ts#prepareColumnOptions` — `+loop +if +loop`
- `connection-adapters/mysql/schema-dumper.ts#schemaType` — `+if`
- `connection-adapters/mysql/schema-dumper.ts#schemaLimit` — `+if +if +if +if +if +if`
- `connection-adapters/mysql/schema-dumper.ts#schemaPrecision` — `+if`
- `connection-adapters/mysql/schema-statements.ts#indexes` — `+loop +if`
- `connection-adapters/mysql/schema-statements.ts#createTable` — `+if +if +if +if`
- `connection-adapters/mysql/schema-statements.ts#extractSchemaQualifiedName` — `+if`
- `connection-adapters/mysql2/database-statements.ts#executeBatch` — `+if +if`
- `connection-adapters/mysql2/database-statements.ts#isMultiStatementsEnabled` — `+if`
- `connection-adapters/mysql2/database-statements.ts#performQuery` — `-try +if +if +if +if +if +if`
- `connection-adapters/mysql2/database-statements.ts#castResult` — `+loop +if +if +if +if`
- `connection-adapters/sqlite3/schema-definitions.ts#references` — `+if`
- `connection-adapters/sqlite3/schema-dumper.ts#virtualTables` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
