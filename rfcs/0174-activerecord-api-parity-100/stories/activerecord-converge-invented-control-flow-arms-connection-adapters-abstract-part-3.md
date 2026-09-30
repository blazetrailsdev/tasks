---
title: "activerecord: remove or credit the 50 invented branches in connection-adapters-abstract part 3"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-connection-adapters-part-1"]
deps-rfc: []
est-loc: 380
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

- `connection-adapters/abstract/schema-statements.ts#addColumns` — `+if +throw`
- `connection-adapters/abstract/schema-statements.ts#removeColumns` — `+if`
- `connection-adapters/abstract/schema-statements.ts#removeColumn` — `+throw +if`
- `connection-adapters/abstract/schema-statements.ts#removeIndex` — `+if`
- `connection-adapters/abstract/schema-statements.ts#removeReference` — `+if +if +if`
- `connection-adapters/abstract/schema-statements.ts#removeForeignKey` — `+if`
- `connection-adapters/abstract/schema-statements.ts#foreignKeyExists` — `+if`
- `connection-adapters/abstract/schema-statements.ts#foreignKeyOptions` — `+if +if +if`
- `connection-adapters/abstract/schema-statements.ts#assumeMigratedUptoVersion` — `+if`
- `connection-adapters/abstract/schema-statements.ts#typeToSql` — `+if`
- `connection-adapters/abstract/schema-statements.ts#bulkChangeTable` — `-loop +if`
- `connection-adapters/abstract/schema-statements.ts#indexNameForRemove` — `+if +if`
- `connection-adapters/abstract/schema-statements.ts#foreignKeyName` — `+if +if +throw`
- `connection-adapters/abstract/schema-statements.ts#foreignKeyForBang` — `+if`
- `connection-adapters/abstract/schema-statements.ts#checkConstraintName` — `+if +if +throw`
- `connection-adapters/abstract/schema-statements.ts#checkConstraintForBang` — `+if`
- `connection-adapters/abstract/schema-statements.ts#validateIndexLengthBang` — `+if`
- `connection-adapters/abstract/schema-statements.ts#validateTableLengthBang` — `+if`
- `connection-adapters/abstract/schema-statements.ts#removeColumnsForAlter` — `+if`
- `connection-adapters/abstract/transaction.ts#addChild` — `+if`
- `connection-adapters/abstract/transaction.ts#addRecord` — `+if +if`
- `connection-adapters/abstract/transaction.ts#rollbackRecords` — `+if +if +if`
- `connection-adapters/abstract/transaction.ts#beforeCommitRecords` — `-loop +if +if`
- `connection-adapters/abstract/transaction.ts#commitRecords` — `+if +if +if +if`
- `connection-adapters/abstract/transaction.ts#appendCallbacks` — `+if`
- `connection-adapters/abstract/transaction.ts#prepareInstancesToRunCallbacksOn` — `+if`
- `connection-adapters/abstract/transaction.ts#dirtyCurrentTransaction` — `+if`
- `connection-adapters/abstract/transaction.ts#restoreTransactions` — `+if`
- `connection-adapters/abstract/transaction.ts#isRestorable` — `+if`
- `connection-adapters/abstract/transaction.ts#currentTransaction` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
