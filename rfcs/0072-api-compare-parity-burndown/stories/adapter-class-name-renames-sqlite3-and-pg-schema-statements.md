---
title: "adapter-class-name-renames-sqlite3-and-pg-schema-statements"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5929
claim: "2026-08-02T22:58:48Z"
assignee: "adapter-class-name-renames-sqlite3-and-pg-schema-statements"
blocked-by: null
closed-reason: null
---

## Context

Split out of `extra-surface-adapter-class-names` (PR pending). That story
decided the novel adapter class names across `connection-adapters/`: the six
driver-variant adapters got `@noRailsEquivalent PERMANENT` tags, and
`SQLite3IntegerType` was renamed to Rails' `SQLite3Integer`
(sqlite3_adapter.rb:486). Two names are renames Rails' layout demands but that
could not ship inside that PR:

1. `AbstractSQLite3Adapter` (`connection-adapters/sqlite3-adapter.ts:197`).
   Rails declares `SQLite3Adapter` in that file (sqlite3_adapter.rb:30) and the
   whole sqlite3_adapter.rb port lives on this class (the `moved` list for the
   file is the sqlite3_adapter.rb method set), so it is a renamed port, NOT a
   novel class — tagging it would be wrong. The rename is mechanical but wide:
   228 references across 60 files, over the 500-LOC PR ceiling on its own.
   Ship it as the single-mechanical-rename exception.

2. `PostgreSQLSchemaStatements`
   (`connection-adapters/postgresql/schema-statements-class.ts:102`) →
   `SchemaStatements`, matching Rails' `PostgreSQL::SchemaStatements`
   (postgresql/schema_statements.rb) and the unprefixed convention the rest of
   `connection-adapters/postgresql/` already follows (`TableDefinition`,
   `Table`, `AlterTable`). **This rename was attempted and reverted**: it costs
   one matched method (`quote_schema_name`, parity:api data layer
   7724 → 7723). Root cause: `include(PostgreSQLAdapter, X)` is recorded by
   `extract-ts-api.ts:1084` as the bare short name `X` on `extends`, and
   `resolveParent` (`scripts/api-compare/compare.ts:1549`) resolves a duplicated
   short name by counting shared leading path segments. With the pg class named
   `SchemaStatements`, `connection-adapters/abstract/schema-statements.ts`,
   `connection-adapters/postgresql/schema-statements-class.ts` and
   `connection-adapters/sqlite3/schema-statements.ts` all score 1 shared
   segment against `connection-adapters/postgresql-adapter.ts`, so the tie is
   broken by index order and lands on the abstract class, dropping the pg
   class's methods from `PostgreSQLAdapter`'s inherited set. The trails-only
   flattened name is what currently makes that resolution unambiguous, i.e. the
   tooling rewards the divergence.

## Acceptance criteria

- `AbstractSQLite3Adapter` renamed to `SQLite3Adapter` across src, tests and
  scripts; PR notes it is the single-mechanical-rename exception to the 500-LOC
  ceiling. Test names (describe/it strings) are NOT reworded.
- `resolveParent` / the include-edge recording is made able to disambiguate a
  duplicated short name by the importing file's actual import (the symbol's
  declaration file is available at extraction time), OR an equivalent fix is
  agreed; then `PostgreSQLSchemaStatements` is renamed to `SchemaStatements`
  with parity:api data-layer totals unchanged (7724 or better).
- `pnpm parity:api:extra --package activerecord` reports 0 novel names for
  `connection-adapters/sqlite3-adapter.ts` except names owned by other stories
  (`exec`, `executeMutation`) and 0 for
  `connection-adapters/postgresql/schema-statements-class.ts` except
  `createRange` / `dropRange`.
- Scoped `pnpm vitest run` on the touched adapter/driver test files passes.
