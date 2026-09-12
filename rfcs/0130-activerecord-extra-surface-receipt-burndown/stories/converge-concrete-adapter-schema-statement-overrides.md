---
title: "converge-concrete-adapter-schema-statement-overrides"
status: draft
updated: 2026-09-12
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

`receipt-moved-adapter-classes-and-pool` receipted these concrete-adapter names as
`@noRailsEquivalent CONVERGEABLE converge-concrete-adapter-schema-statement-overrides`.
Each is a public member on the adapter CLASS where Rails defines the method in a
schema/database-statements module (or on the abstract adapter only), so `parity:api:extra`
scores it as a moved extra.

| TS file                                         | Names                                                                                                | Rails home                                                                                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `connection-adapters/mysql2-adapter.ts`         | `tables`, `views`, `tableExists`, `primaryKey`                                                       | `abstract/schema_statements.rb:51,66,59,145` via `mysql/schema_statements.rb` `data_source_sql` / `abstract_mysql_adapter.rb` `primary_keys` |
| `connection-adapters/mysql2-adapter.ts`         | `createSchemaDumper`                                                                                 | `mysql/schema_statements.rb:107`                                                                                                             |
| `connection-adapters/mysql2-adapter.ts`         | `explain`                                                                                            | `mysql/database_statements.rb:27`                                                                                                            |
| `connection-adapters/mysql2-adapter.ts`         | `internalExecQuery`, `internalExecute`                                                               | `abstract/database_statements.rb:546,589` (driver half is `raw_execute`/`perform_query`)                                                     |
| `connection-adapters/mysql2-adapter.ts`         | static `databaseExists`                                                                              | `abstract_adapter.rb:358` `self.database_exists?`                                                                                            |
| `connection-adapters/postgresql-adapter.ts`     | interface `tables`, `views`, `tableExists`, `columns`, `foreignKeyExists`, `validateIndexLengthBang` | `abstract/schema_statements.rb:51,66,59,107,1237`; `validate_index_length!` private in `abstract/schema_statements.rb`                       |
| `connection-adapters/postgresql-adapter.ts`     | `internalExecQuery`, `internalExecute`                                                               | `abstract/database_statements.rb:546,589`                                                                                                    |
| `connection-adapters/sqlite3-adapter.ts`        | `tables`, `views`, `tableExists`                                                                     | `abstract/schema_statements.rb:51,66,59` via `sqlite3/schema_statements.rb` `data_source_sql`                                                |
| `connection-adapters/sqlite3-adapter.ts`        | `fetchTypeMetadata`                                                                                  | `abstract/schema_statements.rb:1717`                                                                                                         |
| `connection-adapters/sqlite3-adapter.ts`        | `internalExecute`                                                                                    | `abstract/database_statements.rb:589`                                                                                                        |
| `connection-adapters/abstract-mysql-adapter.ts` | `columns`                                                                                            | `abstract/schema_statements.rb:107` over `column_definitions` (`abstract_mysql_adapter.rb:962`)                                              |
| `connection-adapters/abstract-mysql-adapter.ts` | `nextKey`                                                                                            | `postgresql_adapter.rb:302` (PG `StatementPool#next_key`; mysql has no counterpart)                                                          |
| `connection-adapters/abstract-adapter.ts`       | optional `currentDatabase?`                                                                          | `abstract_mysql_adapter.rb:296`, `postgresql/schema_statements.rb:220`                                                                       |

## Acceptance criteria

- Each name is deleted from the adapter class (the abstract/module port answers it, fed by
  the adapter's `data_source_sql` / `column_definitions` / `raw_execute` hooks) or moved to
  the TS file mirroring its Rails home.
- Every receipt citing this story is gone; `pnpm parity:api:extra --package activerecord`
  shows none of these names; `total` tightened with `pnpm parity:api:extra:tighten`.
- All three adapter lanes green.
