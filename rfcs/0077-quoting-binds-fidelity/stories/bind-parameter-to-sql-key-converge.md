---
title: "bind_parameter_test to_sql_key is replaced by a notification-capture helper"
status: ready
updated: 2026-08-28
rfc: "0077-quoting-binds-fidelity"
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

`packages/activerecord/src/bind-parameter.test.ts` replaces Rails'
`to_sql_key(arel)` helper (`vendor/rails/activerecord/test/cases/bind_parameter_test.rb:261-264`)

    def to_sql_key(arel)
      sql = @connection.to_sql(arel)
      @connection.respond_to?(:sql_key, true) ? @connection.send(:sql_key, sql) : sql
    end

with a `captureSelectSql` subscriber that reads the executed SQL off the
`sql.active_record` notification payload and runs THAT through `sqlKey`. Eight
call sites use it (`bind-parameter.test.ts:135-246`).

The original justification was that trails' `to_sql` always inlined bind values
and so could not reproduce the placeholder SQL the statement pool is keyed by.
That is no longer true: `single-to-sql-and-binds-compile-path` converged
`toSql`/`toSqlAndBinds` onto Rails' single `to_sql_and_binds` path
(`abstract/database_statements.rb:20-46`), so `conn.toSql(arel)` now emits
`?`/`$1` placeholders whenever `preparedStatements` is on — exactly what
`to_sql_key` needs.

## Acceptance criteria

- [ ] A `toSqlKey(conn, arel)` helper mirrors rb:261-264, and the eight
      `captureSelectSql` / `conn.sqlKey(cap.sqls.at(-1))` sites use it instead.
- [ ] `captureSelectSql` and its deviation comment are deleted.
- [ ] `bind-parameter.test.ts` passes on the SQLite, PostgreSQL and
      MySQL/MariaDB lanes.
