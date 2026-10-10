---
title: "activerecord: Mysql2 cast reads TIMESTAMP columns as UTC whatever database_timezone says"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8751, which made the Mysql2 wire cast answer a `Time` in the zone `queryOptions.databaseTimezone` names.

The mysql2 gem builds every date-time value the same way, whatever the column type: `Time.<db_timezone>(year, …)`, converted
afterwards only when `application_timezone` is set (`vendor/mysql2/0.5.6/ext/mysql2/result.c:666-673` for the binary
protocol, `:855-862` for text). `MYSQL_TYPE_TIMESTAMP` and `MYSQL_TYPE_DATETIME` share that case (`result.c:645-647`,
`:820-822`). Rails sets `database_timezone` alone (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:161`).

trails' cast (`packages/activerecord/src/mysql2/client.ts`, the `TIMESTAMP` / `DATETIME` case of `cast`) adds an arm the gem
does not have:

```ts
const dbTimezone =
  field.type.startsWith("TIMESTAMP") || queryOptions.databaseTimezone === "utc" ? "utc" : "local";
```

so a `TIMESTAMP` column is always read as UTC, even on a connection whose `database_timezone` is `:local`. The arm is there
because the connection's session `time_zone` is UTC in the test setup, and MySQL converts a `TIMESTAMP` to the session zone
on the wire. Whether the session zone is forced to UTC by trails (and where) is the first thing to establish.

## Acceptance criteria

- [ ] The cast reads `TIMESTAMP` and `DATETIME` through the same `Time[databaseTimezone](…)` call, with no column-type arm.
- [ ] Whatever makes a `TIMESTAMP` round-trip correctly today (a forced session `time_zone`, if any) is either Rails' own
      `configure_connection` behaviour (`abstract_mysql_adapter.rb`, the `@@SESSION.time_zone` variable) or is removed.
- [ ] `adapters/mysql2/**`, `mysql2/**` and the timestamp tests pass on the MySQL lane with `default_timezone` both `:utc`
      and `:local`.
