---
title: "MySQL tests: burn down self-built Mysql2Adapter, batch 3 (mysql2 suites + second-connection audit)"
status: done
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: ["mysql-tests-self-built-adapter-burndown-batch-2"]
deps-rfc: []
est-loc: 250
priority: null
pr: 5328
claim: "2026-07-25T22:54:53Z"
assignee: "mysql-tests-self-built-adapter-burndown-batch-3"
blocked-by: null
closed-reason: null
---

## Context

Batch 3 (final) of the `new Mysql2Adapter(MYSQL_TEST_URL)` burn-down started by
`mysql-tests-self-built-adapter-burndown`. Uses the helpers that story's PR
added to
`packages/activerecord/src/adapters/abstract-mysql-adapter/test-helper.ts`:
`describeIfMysqlAdapter` (the port of `current_adapter?(:Mysql2Adapter)`) and
`leaseMysqlAdapter()` (the port of `@connection = Base.lease_connection`).

`(a)` — convert to the ambient connection:

| site                                                                | note                                                 |
| ------------------------------------------------------------------- | ---------------------------------------------------- |
| `adapters/mysql2/mysql2-adapter.test.ts:46`                         | `adapters/mysql2/connection_test.rb` setup leases    |
| `adapters/mysql2/bigint-roundtrip.test.ts:17`                       | roundtrip through the ambient connection             |
| `adapters/mysql2/check-constraint-quoting.test.ts:16`               | Rails' check-constraint tests ride `Base.connection` |
| `adapters/mysql2/mysql2-adapter-perform-query.trails.test.ts:25`    | TS-only extra                                        |
| `adapters/abstract-mysql-adapter/transaction.test.ts:11`            | `transaction_test.rb:9` leases                       |
| `adapters/abstract-mysql-adapter/statement-pool.test.ts:10`         | the primary adapter only                             |
| `adapters/abstract-mysql-adapter/nested-deadlock.test.ts:32`        | primary only                                         |
| `adapters/abstract-mysql-adapter/nested-deadlock.trails.test.ts:16` | primary only                                         |
| `adapters/abstract-mysql-adapter/connection.test.ts:19,467`         | primary only                                         |

`(b)` — leave self-built, each with a one-line reason at the call site:

- `transaction.test.ts:35,82`, `nested-deadlock.test.ts:117,133,147`,
  `statement-pool.test.ts:151`, `count-deleted-rows-with-lock.test.ts:34`: a
  _second_ connection is the point (lock contention / deadlock / concurrent
  DELETE). Rails spawns a second thread on the pool for these; a second
  in-test adapter is the closest faithful shape.
- `statement-pool.test.ts:115,138,145`: differently configured
  (`statementLimit`).
- `connection.test.ts:31,167,249,271,282,294,421,431,443,455`: deliberately
  bad or alternate configs (unreachable host, bad user, no such database).
- `defaults.test.ts:475`: `{ uri, strict }` — a deliberately non-strict second
  adapter.
- `adapters/mysql2/savepoint-reconnect.trails.test.ts:35`: **audit first.** It
  kills and reconnects its own connection; doing that to the leased pool
  connection may poison the pool for later tests in the worker. If it must stay
  self-built, record the reason at the call site and close this out.
- `adapters/mysql2/mysql2-adapter.trails.test.ts:57,146,160`: **audit** whether
  the `fresh` adapters' fresh state is load-bearing; `:146` looks like a plain
  `(a)` setup.

## Acceptance criteria

- [ ] Every `(a)` site rides `leaseMysqlAdapter()` under
      `describeIfMysqlAdapter`.
- [ ] Every remaining `new Mysql2Adapter(MYSQL_TEST_URL)` site has a one-line
      call-site comment naming why it needs its own adapter.
- [ ] The two audit items above are resolved either way (converted, or kept
      with a documented reason).
- [ ] Test names unchanged; CI green on all three adapters.
