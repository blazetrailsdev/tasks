---
title: "receipt-connection-adapters-matched-files"
status: draft
updated: 2026-09-05
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

Sibling of `receipt-connection-adapters-and-sqlite-drivers`, which the story
itself authorises ("May be split into two PRs (matched files / no-counterpart
files) if it exceeds the LOC ceiling — file them as siblings"). That story's PR
took the files with NO Rails counterpart plus `adapters/` and `sqlite/`; this one
takes the ~54 novel names left in connection-adapters files that DO map onto a
`.rb`, where a file-level blanket is refused by `fileTagVerdict` and each name is
read against its counterpart.

Measured 2026-09-05 with `pnpm parity:api:extra --package activerecord
--novel-only` (before the sibling PR):

| Names  | TS file                                                                                                                                                                                                                                                                          | Rails counterpart                                                                                                                                                                                                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5      | `connection-adapters/abstract/transaction.ts`                                                                                                                                                                                                                                    | `abstract/transaction.rb` — `fullyRolledBack`, `rolledBack`, `runAfterCommitCallbacks`, `runAfterRollbackCallbacks`, `TransactionCallback`. Rails has `#rolledback!` and `#commit_records`; check `docs/ruby-ts-conventions.md` before assuming these are novel rather than misspelled. |
| 3      | `connection-adapters/abstract/savepoints.ts`                                                                                                                                                                                                                                     | `abstract/savepoints.rb` — `createSavepointSql`, `execRollbackToSavepointSql`, `releaseSavepointSql`                                                                                                                                                                                    |
| 3      | `connection-adapters/abstract/schema-definitions.ts`                                                                                                                                                                                                                             | `abstract/schema_definitions.rb` — `assertSafeMysqlIdentifier`, `char`, `datetimePhysicalType`                                                                                                                                                                                          |
| 3      | `connection-adapters/pool-config.ts`                                                                                                                                                                                                                                             | `pool_config.rb` — `connectionSpecName`, `poolInitialized`, `poolKey`                                                                                                                                                                                                                   |
| 3      | `connection-adapters/sql-type-metadata.ts`                                                                                                                                                                                                                                       | `sql_type_metadata.rb` — `deduplicateKey`, `fromJSON`, `TYPE_METADATA_CLASSES`                                                                                                                                                                                                          |
| 3      | `connection-adapters/mysql/schema-dumper.ts`                                                                                                                                                                                                                                     | `mysql/schema_dumper.rb` — `defaultPrimaryKeyType`, `tableCollationCache`, `virtualExpressionCache`                                                                                                                                                                                     |
| 3      | `connection-adapters/postgresql/schema-statements.ts`                                                                                                                                                                                                                            | `postgresql/schema_statements.rb` — `createRange`, `dropRange`, `quoteLiteral`                                                                                                                                                                                                          |
| 2 each | `abstract/query-cache.ts`, `deduplicable.ts`, `mysql/schema-statements.ts`, `postgresql-adapter.ts`, `sqlite3-adapter.ts`, `postgresql/oid/{bit,cidr,hstore,range,uuid}.ts`                                                                                                      |                                                                                                                                                                                                                                                                                         |
| 1 each | `abstract-adapter.ts`, `mysql2-adapter.ts`, `abstract/connection-handler.ts`, `abstract/connection-pool.ts`, `abstract/database-statements.ts`, `column.ts`, `postgresql/oid/array.ts`, `postgresql/schema-definitions.ts`, `postgresql/schema-dumper.ts`, `postgresql/utils.ts` |                                                                                                                                                                                                                                                                                         |

`exec` / `executeMutation` recur across four adapters and are one decision, not
four. So do `deduplicateKey` (`deduplicable.ts` + `sql-type-metadata.ts`) and
`defaultPrimaryKeyType` (`mysql/schema-dumper.ts` + `postgresql/schema-dumper.ts`).

Coordinate with RFC 0119: a name 0119 is about to delete should not get a
receipt here.

## Acceptance criteria

- Every name resolved by one of RFC 0130's four routes, route stated per file in
  the PR body.
- No file-level `@noRailsEquivalent` — every file here has a counterpart and
  `fileTagVerdict` refuses the blanket.
- `pnpm parity:api:extra --package activerecord --novel-only` shows these files
  at 0 novel; the mark is tightened in the same PR.
- `pnpm parity:api:calls` / `:args` show no new rows; the three AR adapter lanes
  stay green.
