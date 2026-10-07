---
title: "activerecord: dataSourceSql drops the kwargs-in-first-position arm Rails' data_source_sql does not have"
status: draft
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `data_source_sql(name = nil, type: nil)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb:181`, `postgresql/schema_statements.rb`, `abstract_mysql_adapter.rb`) takes `type:` as a kwarg, and `tables` / `views` call it as `data_source_sql(type: "BASE TABLE")` (`abstract/schema_statements.rb`).

trails ports that call as `this.dataSourceSql({ type: "BASE TABLE" })`, which `parity:api:calls:args` matches against Rails' kwargs-only call. So every `dataSourceSql` takes its first parameter as `string | null | { type?: string }` and carries an `if (typeof name === "object")` arm that moves it into `options`, an arm Rails' method does not have:

- `packages/activerecord/src/connection-adapters/sqlite3/schema-statements.ts` (`dataSourceSql`, unreceipted: `parity:api:arms:throws` reports the declaration as not compared, so an `@inventedArm` tag there is stale)
- `packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts` (`dataSourceSql`, unreceipted)
- `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts` (`dataSourceSql`, unreceipted, and a wrapper over `mysql/schema-statements.ts`)

Rewriting the call sites to `dataSourceSql(undefined, { type })` was tried in trails#8638 and reds `parity:api:calls:args` with three new rows (`tables`, `views`, PG `foreign_tables`), so the fix needs the call-argument comparer to read a leading `undefined` positional ahead of a kwargs hash as Rails' omitted optional, or another settled spelling for "kwargs after an omitted optional positional".

## Acceptance criteria

- [ ] No `dataSourceSql` body carries the kwargs-in-first-position arm, and each signature is `(name, { type })` as Rails' `(name = nil, type: nil)`.
- [ ] `pnpm parity:api:calls:args` stays green with no new baseline row.
