---
title: "activerecord: Mysql2Adapter sends SET time_zone on every new client; Rails sends none"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
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

`packages/activerecord/src/connection-adapters/mysql2-adapter.ts` `_ensureClient` runs
`await conn.query("SET time_zone = '+00:00'")` on every new client, right after `Mysql2Adapter.newClient`
resolves, ending the connection if the statement fails. trails#8710 moved the statement there from an `initSql`
option that `newClient` used to run under a second `try`.

Rails sends no such statement. `Mysql2Adapter.new_client`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:23-36`) is
`::Mysql2::Client.new(config)`, and `AbstractMysqlAdapter#configure_connection`
(`abstract_mysql_adapter.rb:912-960`) sets only `wait_timeout`, `sql_mode`, `NAMES` and the configured
`variables`. The mysql2 gem converts times on the client: `Mysql2Adapter#connect`
(`mysql2_adapter.rb:138-146`) and the query options
(`mysql2/database_statements.rb`, `database_timezone: default_timezone`) tell the gem which zone the server's
naive values are in, and the session time zone is left at the server default.

## Converged shape

No `SET time_zone` statement. The npm `mysql2` connection is opened with the `timezone` option derived from
`default_timezone` (`"Z"` for `:utc`, `"local"` for `:local`), which is what `database_timezone` does in the gem,
and the row cast reads temporal values in that zone. A user who wants a session zone sets it through
`variables: { time_zone: ... }`, as in Rails.

## Acceptance criteria

- [ ] `_ensureClient` sends no statement of its own.
- [ ] Temporal round-trips are unchanged on MariaDB for `default_timezone` `utc` and `local`, on a server whose
      global `time_zone` is not UTC.
- [ ] `adapters/mysql2` and `adapters/abstract-mysql-adapter` suites stay green.
