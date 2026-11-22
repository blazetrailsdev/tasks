---
title: "mysql2-client-prepare-prepares-on-the-server"
status: draft
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Client#prepare prepares on the server

## Context

`Mysql2::Client#prepare` (`vendor/mysql2/0.5.6/ext/mysql2/client.c`, `rb_mysql_client_prepare_statement` → `rb_mysql_stmt_new`, `ext/mysql2/statement.c:100-160`) runs `mysql_stmt_prepare` at once: it raises `Mysql2::Error` on a closed client, and `param_count`, `field_count` and `fields` read the prepared handle. `packages/mysql2/lib/client.ts` `prepare` is synchronous and `Statement` (`lib/statement.ts`) prepares lazily through `mysql2/promise`'s `execute`, so none of that is observable and `close` does not lower the server's prepared-statement count.

`packages/mysql2/test/statement.test.ts` parks these under `// BLOCKED: mysql2-client-prepare-prepares-on-the-server`: "should create a statement", "should raise an exception when server disconnects", "should tell us the param count", "should tell us the field count", `#fields` (`statement_spec.rb:328-343`) and "should free server resources" (`:711-716`).

## Acceptance criteria

- [ ] `Client#prepare` is async (`await client.prepare(sql)`), calls `connection.prepare`, and raises `Mysql2::Error` on a closed client; callers in `packages/activerecord` are updated.
- [ ] `Statement#paramCount`, `#fieldCount`, `#fields` and `#close` read / release the npm `PreparedStatementInfo`.
- [ ] The BLOCKED examples above are un-skipped and green on the MariaDB lane.
