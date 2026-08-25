---
title: "DatabaseStatements#isWriteQuery ships a generic classifier where Rails' write_query? raises NotImplementedError"
status: draft
updated: 2026-08-20
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `DatabaseStatements#write_query?` is an abstract primitive
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:118-120`):

    def write_query?(sql)
      raise NotImplementedError
    end

Every adapter supplies its own — `AbstractMysqlAdapter#write_query?`,
`PostgreSQLAdapter#write_query?`, `SQLite3Adapter#write_query?` — because
classifying a statement as a write is dialect-specific.

trails' `DatabaseStatements` mixin object instead ships a working generic
implementation
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1581-1583`):

    isWriteQuery(sql: string): boolean {
      return isWriteQuerySql(sql);
    },

delegating to `connection-adapters/sql-classification.ts:38`, a trails-invented
regex classifier with no Rails counterpart.

All three concrete adapters do override it
(`abstract-mysql-adapter.ts:903`, `postgresql-adapter.ts:2176`, and
SQLite3's), so the generic body is dead for every adapter trails ships. It is
live only for a host that mixes in `DatabaseStatements` without overriding —
where Rails would have raised, telling the author a primitive is missing, trails
silently applies a dialect-agnostic guess. `isPreventingWrites()` gates on this
(`abstract-adapter.ts:1630`), so a wrong answer silently permits a write on a
replica connection rather than raising `ReadOnlyError`.

Surfaced by PR #6772, which removed this file's duplicate definitions: the
file-level `export function isWriteQuery` DID raise, and it was the copy
`parity:api` matched, so the divergence was invisible while the duplication
stood. The trails-only test asserting the raise was deleted with the dead
function it covered.

## Converged shape

`DatabaseStatements.isWriteQuery` raises `NotImplementedError`, mirroring
`database_statements.rb:118-120`. Check whether `isWriteQuerySql` retains any
real caller once it does — `sqlite3-adapter.ts:617` uses it directly, and
SQLite3's `write_query?` may be its only other consumer; if the adapter
overrides are its whole population, consider whether the helper belongs inside
them rather than as shared invented surface.

Watch for hosts that relied on the generic body: `mysql-type-lookup.test.ts:17`
already declares its own override, which suggests test doubles are the real
consumers and each needs its own arm.

## Acceptance criteria

- [ ] `DatabaseStatements.isWriteQuery` raises `NotImplementedError`, matching
      `abstract/database_statements.rb:118-120`.
- [ ] Every host that mixed in the generic body and needs a real answer supplies
      its own `isWriteQuery`, dialect-appropriate.
- [ ] `isWriteQuerySql`'s remaining callers are accounted for — either it keeps a
      justified population or it folds into the adapter overrides.
- [ ] `parity:api:calls` / `parity:api:calls:args` non-negative;
      `parity:api:extra --package activerecord` does not grow.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green, in particular
      `adapter-prevent-writes.test.ts`.
