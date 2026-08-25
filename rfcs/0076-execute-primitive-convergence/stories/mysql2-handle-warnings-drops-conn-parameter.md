---
title: "mysql2 handle_warnings takes a trailing conn parameter Rails has no counterpart for"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6336
claim: "2026-08-10T13:53:22Z"
assignee: "port-test-date"
blocked-by: null
closed-reason: null
---

## Context

Rails' mysql2 `perform_query` calls `handle_warnings(sql)`
(`activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:102`),
and `handle_warnings` reads `@raw_connection` for the `SHOW WARNINGS`
round-trip (`abstract_mysql_adapter.rb`) — the adapter owns one socket, so the
connection needs no parameter.

PR #6327 converged the trails-invented `_handleWarningsOn(conn, sql)` onto the
Rails name, but had to keep the connection as a trailing optional parameter:

```ts
override async handleWarnings(sql: string, conn?: mysql.Connection): Promise<void>
```

(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`), because
trails hands connections out of the pool per query rather than holding one on
the adapter. The Rails parameter and its position are unchanged and an absent
`conn` is the base class's no-op, but the extra parameter is still surface Rails
does not have, and it forces `performQuery`'s host interface to declare
`handleWarnings?(sql, conn?)`
(`packages/activerecord/src/connection-adapters/mysql2/database-statements.ts`).

## Acceptance criteria

- [ ] `handleWarnings(sql)` takes Rails' argument list exactly, sourcing the
      connection the way Rails does rather than from a parameter (the adapter's
      current raw connection for the in-flight query).
- [ ] The `conn` parameter is gone from the mysql2 `PerformQueryHost` interface
      and from the `performQuery` call site.
- [ ] `db_warnings_action` behavior is unchanged — the existing warning suites
      (raise / log / report / ignore) stay green on both MySQL lanes.
