---
title: "converge-receipted-activerecord-root-and-adapter-names"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0130's phase-6 bundle (`receipt-package-root-base-fixtures-enum-errors` +
`receipt-connection-adapters-matched-files`) resolved activerecord's last 140 novel
names. Dead names were deleted, the barrel stopped re-exporting, `EnumType#subtype`
converged onto `attr_reader :subtype` (enum.rb:211). The names below carry
`@noRailsEquivalent CONVERGEABLE converge-receipted-activerecord-root-and-adapter-names` instead: each is live trails surface with
no Rails `def` behind it, and each must either fold into the Rails method its
callers stand in for (route 1) or be renamed to the Rails spelling.

| TS file                                                                          | Names                                                                                                                                                                             |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/activerecord/src/aggregations.ts`                                      | `copyAggregationCacheForDup`, `getAggregationCache`, `includeAggregations`                                                                                                        |
| `packages/activerecord/src/ar-config.ts`                                         | `globalThreadPoolAsyncQueryExecutor`                                                                                                                                              |
| `packages/activerecord/src/association-cache.ts`                                 | `AssociationCache`, `AssociationCacheFacet`, `has`, `instances`                                                                                                                   |
| `packages/activerecord/src/autosave-association.ts`                              | `flushPendingReplaces`                                                                                                                                                            |
| `packages/activerecord/src/base.ts`                                              | `findGlobalId`, `findSignedGlobalId`, `withCte`                                                                                                                                   |
| `packages/activerecord/src/coders/yaml-column.ts`                                | `DisallowedClass`                                                                                                                                                                 |
| `packages/activerecord/src/connection-adapters/abstract-adapter.ts`              | `executeMutation`                                                                                                                                                                 |
| `packages/activerecord/src/connection-adapters/abstract/connection-handler.ts`   | `clearAllConnections`                                                                                                                                                             |
| `packages/activerecord/src/connection-adapters/abstract/query-cache.ts`          | `makeCachedSelectAll`                                                                                                                                                             |
| `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`   | `assertSafeMysqlIdentifier`, `char`, `datetimePhysicalType`                                                                                                                       |
| `packages/activerecord/src/connection-adapters/abstract/transaction.ts`          | `rolledBack`, `TransactionCallback`                                                                                                                                               |
| `packages/activerecord/src/connection-adapters/column.ts`                        | `baseType`                                                                                                                                                                        |
| `packages/activerecord/src/connection-adapters/deduplicable.ts`                  | `deduplicateKey`                                                                                                                                                                  |
| `packages/activerecord/src/connection-adapters/mysql/schema-dumper.ts`           | `defaultPrimaryKeyType`, `tableCollationCache`, `virtualExpressionCache`                                                                                                          |
| `packages/activerecord/src/connection-adapters/mysql/schema-statements.ts`       | `MysqlSchemaStatements`, `parseMysqlName`                                                                                                                                         |
| `packages/activerecord/src/connection-adapters/mysql2-adapter.ts`                | `executeMutation`                                                                                                                                                                 |
| `packages/activerecord/src/connection-adapters/pool-config.ts`                   | `connectionSpecName`, `poolInitialized`                                                                                                                                           |
| `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`            | `executeMutation`                                                                                                                                                                 |
| `packages/activerecord/src/connection-adapters/postgresql/oid/cidr.ts`           | `address`, `prefixLength`                                                                                                                                                         |
| `packages/activerecord/src/connection-adapters/postgresql/oid/range.ts`          | `findRangeSeparator`, `unquoteRangeBound`                                                                                                                                         |
| `packages/activerecord/src/connection-adapters/postgresql/oid/uuid.ts`           | `isValidUuid`, `normalizeUuid`                                                                                                                                                    |
| `packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts` | `enumType`                                                                                                                                                                        |
| `packages/activerecord/src/connection-adapters/postgresql/schema-dumper.ts`      | `defaultPrimaryKeyType`                                                                                                                                                           |
| `packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`  | `quoteLiteral`                                                                                                                                                                    |
| `packages/activerecord/src/connection-adapters/postgresql/utils.ts`              | `hashKey`                                                                                                                                                                         |
| `packages/activerecord/src/connection-adapters/sql-type-metadata.ts`             | `deduplicateKey`, `fromJSON`, `TYPE_METADATA_CLASSES`                                                                                                                             |
| `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`               | `executeMutation`                                                                                                                                                                 |
| `packages/activerecord/src/core.ts`                                              | `withIsolatedConnectionState`                                                                                                                                                     |
| `packages/activerecord/src/disable-joins-association-relation.ts`                | `deferred`                                                                                                                                                                        |
| `packages/activerecord/src/encryption-hooks.ts`                                  | `applyPendingEncryptions`, `encryptionHooks`                                                                                                                                      |
| `packages/activerecord/src/enum.ts`                                              | `castEnumValue`, `defineEnum`                                                                                                                                                     |
| `packages/activerecord/src/errors.ts`                                            | `AssociationTargetReplacedDuringLoad`, `fkDetails`, `setConnectionPool`                                                                                                           |
| `packages/activerecord/src/explain-registry.ts`                                  | `collectEnabled`, `collectingQueries`                                                                                                                                             |
| `packages/activerecord/src/fixtures.ts`                                          | `defineFixtures`, `defineJoinTableFixtures`, `FixtureSetPrimaryKeyError`, `prepareJoinTableFixtures`, `prepareModelFixtures`, `throughJoinTableNames`, `throughLabelAssociations` |
| `packages/activerecord/src/integration.ts`                                       | `toParamClass`                                                                                                                                                                    |
| `packages/activerecord/src/migration.ts`                                         | `forVersion`                                                                                                                                                                      |
| `packages/activerecord/src/migration/compatibility.ts`                           | `findVersion`, `registerVersion`, `resetVersionRegistry`                                                                                                                          |
| `packages/activerecord/src/model-codegen.ts`                                     | `generateModels`, `unqualify`                                                                                                                                                     |
| `packages/activerecord/src/multiparameter-attribute-assignment.ts`               | `assignMultiparameterValues`, `extractMultiparameterCallstack`                                                                                                                    |
| `packages/activerecord/src/persistence.ts`                                       | `deleteRow`                                                                                                                                                                       |
| `packages/activerecord/src/query-logs.ts`                                        | `clearContext`, `escapeComment`                                                                                                                                                   |
| `packages/activerecord/src/querying.ts`                                          | `withCte`                                                                                                                                                                         |
| `packages/activerecord/src/reflection.ts`                                        | `computeForeignKey`, `isThrough`                                                                                                                                                  |
| `packages/activerecord/src/result.ts`                                            | `fromRowHashes`                                                                                                                                                                   |
| `packages/activerecord/src/runtime-registry.ts`                                  | `Stats`                                                                                                                                                                           |
| `packages/activerecord/src/schema-dumper.ts`                                     | `statelessTest`                                                                                                                                                                   |
| `packages/activerecord/src/schema-migration.ts`                                  | `allVersions`                                                                                                                                                                     |
| `packages/activerecord/src/scoping/named.ts`                                     | `isRelationInstanceMethod`                                                                                                                                                        |
| `packages/activerecord/src/suppressor.ts`                                        | `isSuppressed`                                                                                                                                                                    |
| `packages/activerecord/src/tasks/database-tasks.ts`                              | `clearRegisteredTasks`, `dumpSchemaFilename`, `metadataTableNames`, `migrationsPath`                                                                                              |
| `packages/activerecord/src/tasks/postgresql-database-tasks.ts`                   | `normalizeSchemaSearchPath`                                                                                                                                                       |
| `packages/activerecord/src/test-databases.ts`                                    | `eachDatabase`                                                                                                                                                                    |
| `packages/activerecord/src/test-fixtures/fixture-connection.ts`                  | `leaseFixtureConnection`, `leaseFixtureConnectionFor`                                                                                                                             |
| `packages/activerecord/src/test-fixtures/with-transactional-fixtures.ts`         | `withTransactionalFixtures`                                                                                                                                                       |
| `packages/activerecord/src/timestamp.ts`                                         | `parseCounterCacheTouch`, `parseTouchAllArgs`, `parseTouchArgs`                                                                                                                   |
| `packages/activerecord/src/token-for.ts`                                         | `setTokenForSecret`                                                                                                                                                               |
| `packages/activerecord/src/transactions.ts`                                      | `afterAllTransactionsCommit`, `currentTransactionPublic`, `savepoint`                                                                                                             |
| `packages/activerecord/src/type/adapter-specific-registry.ts`                    | `compareTo`                                                                                                                                                                       |
| `packages/activerecord/src/type/time.ts`                                         | `getobj`                                                                                                                                                                          |

## Acceptance criteria

- Each name above is deleted (its callers moved onto the Rails method they stand in
  for, citing the `vendor/rails` `file:line`) or renamed to the Rails spelling, and
  its receipt removed in the same change.
- `git grep converge-receipted-activerecord-root-and-adapter-names` returns nothing when the story closes.
- `pnpm parity:api:extra --package activerecord --novel-only` stays at 0 novel;
  `parity:api:calls` / `:args` gain no rows.
