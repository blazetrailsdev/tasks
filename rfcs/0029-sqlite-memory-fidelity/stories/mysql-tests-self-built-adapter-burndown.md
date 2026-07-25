---
title: "MySQL tests: burn down self-built Mysql2Adapter(MYSQL_TEST_URL) to the ambient connection"
status: ready
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5303 converged the MySQL-gated `AdapterTest` block in
`packages/activerecord/src/adapter.test.ts` from a self-built
`new Mysql2Adapter(MYSQL_TEST_URL)` under every `ARCONN` to the ambient
`Base.leaseConnection()` gated on `adapterType === "mysql"` — the real port of
Rails' `current_adapter?(:Mysql2Adapter)`
(`vendor/rails/activerecord/test/cases/adapter_test.rb:13,143`).

The same pattern is still live elsewhere: `new Mysql2Adapter(MYSQL_TEST_URL)`
appears at 40 sites across 29 test files (e.g.
`packages/activerecord/src/adapters/abstract-mysql-adapter/{table-options,
auto-increment,mysql-enum,sql-types,connection}.test.ts`,
`packages/activerecord/src/{defaults,migration}.test.ts`). Rails' counterparts
all ride `ActiveRecord::Base.lease_connection`, so these bypass the leased pool
connection and its config plumbing (`configure_connection`, pool settings,
`prepared_statements`).

Not every site is convertible: some deliberately build a second, differently
configured adapter (Rails does this too, in-test, from the primary config).
This story is an audit + the first burn-down batch, not a blanket rewrite.

Est. is for one PR-sized batch; expect follow-up stories per remaining batch.

## Acceptance criteria

- [ ] Inventory the 40 `new Mysql2Adapter(MYSQL_TEST_URL)` sites, classifying
      each as (a) should lease the ambient connection, or (b) legitimately
      needs its own adapter (with the Rails counterpart cited).
- [ ] Convert one PR-sized batch of the (a) sites to the ambient connection,
      narrowing `describeIfMysql` to the ambient-adapter gate where the Rails
      test is `current_adapter?`-gated.
- [ ] Register the remaining batches as follow-up stories with the inventory
      attached.
- [ ] Test names unchanged; CI green on all three adapters.
