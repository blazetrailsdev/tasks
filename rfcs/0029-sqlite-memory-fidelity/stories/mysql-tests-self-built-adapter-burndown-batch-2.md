---
title: "MySQL tests: burn down self-built Mysql2Adapter, batch 2 (schema/DDL suites)"
status: ready
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Batch 2 of the `new Mysql2Adapter(MYSQL_TEST_URL)` burn-down started by
`mysql-tests-self-built-adapter-burndown` (batch 1). That story's PR added the
two helpers this batch uses, in
`packages/activerecord/src/adapters/abstract-mysql-adapter/test-helper.ts`:

- `describeIfMysqlAdapter` — the port of `current_adapter?(:Mysql2Adapter)`
  (`adapterType === "mysql"`), replacing `describeIfMysql`, which is a
  _server-reachability_ probe that ran these MySQL suites under every `ARCONN`.
- `leaseMysqlAdapter()` — the port of these suites' `setup` line
  `@connection = ActiveRecord::Base.lease_connection`
  (`establishFromTestConfig` + `Base.leaseConnection()` +
  `materializeTransactions()`).

Sites left for this batch (all classified `(a)` — the Rails counterpart leases
the ambient connection, so the self-built adapter bypasses the leased pool
connection and its config plumbing: `configureConnection`, pool settings,
`preparedStatements`):

| site                                                        | Rails counterpart                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `adapters/abstract-mysql-adapter/active-schema.test.ts:13`  | `abstract_mysql_adapter/active_schema_test.rb` setup                                              |
| `adapters/abstract-mysql-adapter/virtual-column.test.ts:16` | `abstract_mysql_adapter/virtual_column_test.rb` setup                                             |
| `adapters/abstract-mysql-adapter/mysql-boolean.test.ts:31`  | `abstract_mysql_adapter/boolean_test.rb` setup                                                    |
| `adapters/abstract-mysql-adapter/bind-parameter.test.ts:24` | `abstract_mysql_adapter/bind_parameter_test.rb` setup                                             |
| `adapters/abstract-mysql-adapter/warnings.test.ts:16`       | `abstract_mysql_adapter/warnings_test.rb` setup                                                   |
| `adapters/abstract-mysql-adapter/schema.test.ts:10,21`      | `abstract_mysql_adapter/schema_test.rb`; `:10` is the `restorer` feeding `rebuildCanonicalTables` |
| `migration.test.ts:2319`                                    | the MySQL-gated block in `migration_test.rb`                                                      |

`bind-parameter.test.ts` is the highest-value one: `preparedStatements` is
exactly the pool config the self-built adapter was skipping.

Stays `(b)` — do NOT convert: `schema.test.ts:196` (`ansi`, built with
`variables: { sql_mode: "ANSI_QUOTES" }` — a deliberately differently
configured adapter, which Rails also builds in-test from the primary config).

## Acceptance criteria

- [ ] Every `(a)` site above rides `leaseMysqlAdapter()` under
      `describeIfMysqlAdapter`; the close-only `afterEach` goes away.
- [ ] `schema.test.ts:196` is left as a self-built adapter, with a one-line
      comment at the call site saying why.
- [ ] Test names unchanged.
- [ ] CI green on all three adapters (the suites now skip on the SQLite and PG
      lanes instead of probing the MySQL server).
