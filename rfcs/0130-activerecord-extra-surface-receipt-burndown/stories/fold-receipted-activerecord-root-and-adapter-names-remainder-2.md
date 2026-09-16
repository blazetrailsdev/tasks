---
title: "fold-receipted-activerecord-root-and-adapter-names-remainder-2"
status: closed
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise gone: no receipt on origin/main names this id (git grep 'names-remainder-2' origin/main is empty). trails#7825 (d8ecc122b1) removed the last 'remainder' receipts and retagged surviving names onto other stories (e.g. dumpSchemaFilename -> converge-adapter-schema-and-result-helper-surface); nothing left for this story's acceptance grep to burn."
---

## Context

Split from `fold-receipted-activerecord-root-and-adapter-names-remainder` (RFC 0130),
whose PRs converged `currentTransactionPublic`, the aggregation-cache helpers,
`findGlobalId`, `setTokenForSecret` (tests assign
`Base.generatedTokenVerifier` directly, as token_for_test.rb:23-34 does),
`toParamClass` (→ `Integration::ClassMethods#to_param`, integration.rb:147,
ported as `ClassMethods.toParam`) and the dead `DatabaseStatementsBase`.

Each name still carrying
`@noRailsEquivalent CONVERGEABLE fold-receipted-activerecord-root-and-adapter-names-remainder-2`
is live trails surface with no Rails `def` behind it, and must fold into the Rails
method its callers stand in for or be renamed to the Rails spelling.

Notes already gathered:

- `AbstractReflection#computeForeignKey` is Rails `foreign_key(infer_from_inverse_of: true)`
  (reflection.rb:554); trails ports `foreignKey` as a getter.
- `deleteRow` is Rails `Persistence#delete` (persistence.rb:439), assigned as
  `delete: _Persistence.deleteRow` in base.ts.
- `dumpSchemaFilename` is the fallback inside `schemaDumpPath`
  (database_tasks.rb:455), which Rails resolves through `db_config.schema_dump(format)`.

Remaining files:

- `packages/activerecord/src/aggregations.ts`
- `packages/activerecord/src/association-cache.ts`
- `packages/activerecord/src/base.ts`
- `packages/activerecord/src/coders/yaml-column.ts`
- `packages/activerecord/src/connection-adapters/abstract-adapter.ts`
- `packages/activerecord/src/connection-adapters/abstract/query-cache.ts`
- `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`
- `packages/activerecord/src/connection-adapters/abstract/transaction.ts`
- `packages/activerecord/src/connection-adapters/deduplicable.ts`
- `packages/activerecord/src/connection-adapters/mysql/schema-dumper.ts`
- `packages/activerecord/src/connection-adapters/mysql/schema-statements.ts`
- `packages/activerecord/src/connection-adapters/mysql2-adapter.ts`
- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`
- `packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts`
- `packages/activerecord/src/connection-adapters/sql-type-metadata.ts`
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`
- `packages/activerecord/src/disable-joins-association-relation.ts`
- `packages/activerecord/src/encryption-hooks.ts`
- `packages/activerecord/src/enum.ts`
- `packages/activerecord/src/errors.ts`
- `packages/activerecord/src/fixtures.ts`
- `packages/activerecord/src/model-codegen.ts`
- `packages/activerecord/src/multiparameter-attribute-assignment.ts`
- `packages/activerecord/src/persistence.ts`
- `packages/activerecord/src/querying.ts`
- `packages/activerecord/src/reflection.ts`
- `packages/activerecord/src/result.ts`
- `packages/activerecord/src/tasks/database-tasks.ts`
- `packages/activerecord/src/test-fixtures/fixture-connection.ts`
- `packages/activerecord/src/test-fixtures/with-transactional-fixtures.ts`
- `packages/activerecord/src/timestamp.ts`
- `packages/activerecord/src/transactions.ts`

## Acceptance criteria

- Each receipted name is deleted (callers moved onto the Rails method, citing the
  `vendor/rails` `file:line`) or renamed to the Rails spelling, receipt removed.
- `git grep fold-receipted-activerecord-root-and-adapter-names-remainder-2` returns nothing.
- `pnpm parity:api:extra --package activerecord --novel-only` stays at 0 novel;
  `parity:api:calls` / `:args` gain no rows.
