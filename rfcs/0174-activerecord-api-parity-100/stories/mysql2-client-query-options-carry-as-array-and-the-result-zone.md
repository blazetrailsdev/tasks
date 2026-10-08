---
title: "activerecord: Mysql2 query_options carry :as and decide the result Time's zone"
status: draft
updated: 2026-10-08
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8686, which moved the MySQL wire cast into `packages/activerecord/src/connection-adapters/mysql2/mysql2-client.ts` and gave `Mysql2Client` a `queryOptions` hash.

Rails' `Mysql2Adapter#configure_connection` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:158-162`) sets two options:

```ruby
@raw_connection.query_options[:as] = :array
@raw_connection.query_options[:database_timezone] = default_timezone
```

trails ports only the second. Two gaps remain:

- `query_options[:as] = :array` is not set. `performQuery` (`mysql2/database-statements.ts`) instead passes `rowsAsArray: true` on each of its three `query` / `execute` calls, an argument Rails' `raw_connection.query(sql)` does not pass.
- `queryOptions.databaseTimezone` steers only how a `DATETIME` is parsed. The zone of the returned `Time` still comes from the global `defaultTimezone()` through `timeFromInstant` (`abstract/temporal-wire.ts`), where the Mysql2 gem answers a UTC or local `Time` from the connection's own `database_timezone`.

## Acceptance criteria

- [ ] `configureConnection` sets `rawConnection.queryOptions.as = "array"`, the client applies it, and `performQuery` drops the per-call `rowsAsArray`.
- [ ] The cast answers a `Time` in the zone `queryOptions.databaseTimezone` names, with no read of the global default.
- [ ] `adapters/mysql2/**` and `connection-adapters/mysql2/**` pass on the MySQL lane; `pnpm parity:api:calls:args` green with no new row.
