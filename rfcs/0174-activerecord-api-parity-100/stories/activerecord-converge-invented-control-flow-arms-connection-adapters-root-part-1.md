---
title: "activerecord: remove or credit the 80 invented branches in connection-adapters-root part 1"
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

- `connection-adapters/abstract-adapter.ts#connectionRetries` — `+if`
- `connection-adapters/abstract-adapter.ts#verifyTimeout` — `+if`
- `connection-adapters/abstract-adapter.ts#isValidType` — `+if`
- `connection-adapters/abstract-adapter.ts#schemaCache` — `+if`
- `connection-adapters/abstract-adapter.ts#unpreparedStatement` — `+rescue +throw +if`
- `connection-adapters/abstract-adapter.ts#reconnectBang` — `+loop +if`
- `connection-adapters/abstract-adapter.ts#verifyBang` — `+if`
- `connection-adapters/abstract-adapter.ts#withRawConnection` — `-if -if +loop`
- `connection-adapters/abstract-adapter.ts#validRawConnection` — `+if`
- `connection-adapters/abstract-adapter.ts#typeMap` — `+if`
- `connection-adapters/abstract-adapter.ts#translateExceptionClass` — `+if +if +if`
- `connection-adapters/abstract-adapter.ts#log` — `+if +throw`
- `connection-adapters/abstract-adapter.ts#columnFor` — `+if`
- `connection-adapters/abstract-adapter.ts#isWarningIgnored` — `+if`
- `connection-adapters/abstract-adapter.ts#findCmdAndExec` — `+if +if`
- `connection-adapters/abstract-adapter.ts#extractLimit` — `+if`
- `connection-adapters/abstract-adapter.ts#compare` — `+loop +if +if +if +if`
- `connection-adapters/abstract-mysql-adapter.ts#supportsExpressionIndex` — `+if`
- `connection-adapters/abstract-mysql-adapter.ts#supportsOptimizerHints` — `+if`
- `connection-adapters/abstract-mysql-adapter.ts#supportsInsertReturning` — `+if`
- `connection-adapters/abstract-mysql-adapter.ts#currentDatabase` — `+if`
- `connection-adapters/abstract-mysql-adapter.ts#dropTable` — `+loop +if +if`
- `connection-adapters/abstract-mysql-adapter.ts#checkConstraints` — `+loop`
- `connection-adapters/abstract-mysql-adapter.ts#showVariable` — `+throw`
- `connection-adapters/abstract-mysql-adapter.ts#columnsForDistinct` — `+if`
- `connection-adapters/abstract-mysql-adapter.ts#quoteString` — `+if`
- `connection-adapters/abstract-mysql-adapter.ts#handleWarnings` — `+if +if`
- `connection-adapters/abstract-mysql-adapter.ts#isWarningIgnored` — `+if`
- `connection-adapters/abstract-mysql-adapter.ts#translateException` — `+if`
- `connection-adapters/abstract-mysql-adapter.ts#supportsInsertRawAliasSyntax` — `+if`
- `connection-adapters/abstract-mysql-adapter.ts#removeForeignKey` — `+if +if`
- `connection-adapters/abstract-mysql-adapter.ts#registerIntegerType` — `+if`
- `connection-adapters/deduplicable.ts#deduplicate` — `+if +loop +if`
- `connection-adapters/deduplicable.ts#registry` — `+if`
- `connection-adapters/abstract-mysql-adapter.ts#removeForeignKey` — `+if +if`
- `connection-adapters/mysql2-adapter.ts#constructor` — `+throw +if +if +if +if +try +if +if +rescue +if +try +if +rescue +if +if +if +if +if`
- `connection-adapters/mysql2-adapter.ts#supportsJson` — `+if`
- `connection-adapters/mysql2-adapter.ts#active` — `-if +try +rescue`
- `connection-adapters/mysql2-adapter.ts#discardBang` — `+if`
- `connection-adapters/mysql2-adapter.ts#connect` — `+throw`
- `connection-adapters/mysql2-adapter.ts#configureConnection` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
