---
title: "fold-receipted-activerecord-root-and-adapter-names-remainder"
status: draft
updated: 2026-09-14
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
closed-reason: null
---

## Context

Split from `fold-receipted-activerecord-root-and-adapter-names` (RFC 0130), whose PR
converged `isRelationInstanceMethod` (→ `method_defined_within?(name, Relation)`,
scoping/named.rb:165, enum.rb:377), `statelessTest` (→ `Regexp#match?`,
abstract/schema_definitions.rb:158,186), `Migration.forVersion` (→ `Migration.[]`,
migration.rb:629, spelled `get`), `normalizeSchemaSearchPath` (→
`search_path.split(",")`, tasks/postgresql_database_tasks.rb:63),
`Registration#compareTo` (→ `<=>`, type/adapter_specific_registry.rb:63, spelled
`compare`), `Type::Time::Value#getobj` (→ `__getobj__`, type/time.rb:8),
`DatabaseTasks.migrationsPath` (duplicate of `migrations_paths`,
database_tasks.rb:87), `eachDatabase`, `datetimePhysicalType` (write-only; PG
`new_column_definition` is postgresql/schema_definitions.rb:275) and the
unused `quoteLiteral` interface member.

Each name below still carries
`@noRailsEquivalent CONVERGEABLE fold-receipted-activerecord-root-and-adapter-names-remainder`:
live trails surface with no Rails `def` behind it. Each must either fold into the
Rails method its callers stand in for or be renamed to the Rails spelling.

Notes already gathered:

- `AbstractReflection#computeForeignKey` is Rails `foreign_key(infer_from_inverse_of: true)`
  (reflection.rb:554); trails ports `foreignKey` as a getter, so converging means
  making `foreignKey` a method that takes the kwarg.
- `deleteRow` is Rails `Persistence#delete` (persistence.rb:439); `delete` cannot be
  a JS function-declaration name, it is assigned as `delete: _Persistence.deleteRow`
  in base.ts.
- `toParamClass` collides with the instance `toParam` export in integration.ts
  (integration.rb:57,147).
- `setTokenForSecret` has no Rails counterpart in token_for.rb.

Remaining names (grep the receipt for the exact sites):

- `packages/activerecord/src/aggregations.ts`
- `packages/activerecord/src/association-cache.ts`
- `packages/activerecord/src/autosave-association.ts`
- `packages/activerecord/src/base.ts`
- `packages/activerecord/src/coders/yaml-column.ts`
- `packages/activerecord/src/connection-adapters/abstract-adapter.ts`
- `packages/activerecord/src/connection-adapters/abstract/database-statements.ts`
- `packages/activerecord/src/connection-adapters/abstract/query-cache.ts`
- `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`
- `packages/activerecord/src/connection-adapters/abstract/transaction.ts`
- `packages/activerecord/src/connection-adapters/deduplicable.ts`
- `packages/activerecord/src/connection-adapters/mysql2-adapter.ts`
- `packages/activerecord/src/connection-adapters/mysql/schema-dumper.ts`
- `packages/activerecord/src/connection-adapters/mysql/schema-statements.ts`
- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`
- `packages/activerecord/src/connection-adapters/postgresql/oid/cidr.ts`
- `packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts`
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`
- `packages/activerecord/src/connection-adapters/sql-type-metadata.ts`
- `packages/activerecord/src/disable-joins-association-relation.ts`
- `packages/activerecord/src/encryption-hooks.ts`
- `packages/activerecord/src/enum.ts`
- `packages/activerecord/src/errors.ts`
- `packages/activerecord/src/fixtures.ts`
- `packages/activerecord/src/integration.ts`
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
- `packages/activerecord/src/token-for.ts`
- `packages/activerecord/src/transactions.ts`

## Acceptance criteria

- Each receipted name is deleted (callers moved onto the Rails method, citing the
  `vendor/rails` `file:line`) or renamed to the Rails spelling, with its receipt
  removed in the same change.
- `git grep fold-receipted-activerecord-root-and-adapter-names-remainder` returns nothing.
- `pnpm parity:api:extra --package activerecord --novel-only` stays at 0 novel;
  `parity:api:calls` / `:args` gain no rows.
