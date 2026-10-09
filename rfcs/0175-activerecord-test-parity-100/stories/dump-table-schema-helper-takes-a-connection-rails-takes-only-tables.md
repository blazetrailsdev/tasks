---
title: "activerecord: dumpTableSchema takes only table names, as dump_table_schema does"
status: draft
updated: 2026-10-09
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/support/schema-dumping-helper.ts` `dumpTableSchema(connection, ...tables)` takes
the connection as its first parameter and dumps `connection.pool`. Rails'
`dump_table_schema(*tables)`
(`vendor/rails/v8.0.2/activerecord/test/support/schema_dumping_helper.rb:4-17`) takes only the table
names and opens with `pool = ActiveRecord::Base.connection_pool`. `dump_all_table_schema`
(`:19-27`) takes `pool:` as a keyword defaulting to `ActiveRecord::Base.connection_pool`; trails'
`dumpAllTableSchema(ignoreTables, pool)` takes it positionally.

After trails#8715 every caller already passes a connection leased from `Base` (about 155 call sites
across `migration/foreign-key.test.ts`, `defaults.test.ts`, `adapters/**`, `schema-dumper*.test.ts`),
so the parameter carries nothing: `connection.pool` is `Base.connectionPool()` at each of them. A
standalone adapter has a `NullPool` and raises in the helper, which is what reddened the PostgreSQL
lanes on that PR.

## Acceptance criteria

- [ ] `dumpTableSchema(...tables)` has Rails' signature and reads `Base.connectionPool()` itself.
- [ ] `dumpAllTableSchema(ignoreTables, { pool })` takes `pool` as an option defaulting to
      `Base.connectionPool()`.
- [ ] Every call site drops the connection argument; no test names are changed.
