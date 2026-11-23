---
title: "mysql2 errors mapped to a CR_* number carry libmysql's message text"
status: draft
updated: 2026-11-23
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`raiseMysql2Error` (`packages/mysql2/lib/client.ts`) maps npm mysql2 codes to libmysql `CR_*` numbers through `CR_ERRNOS` (for example `PROTOCOL_CONNECTION_LOST` and `ECONNRESET` map to 2013), but keeps npm's message text, such as "Connection lost: The server closed the connection.". libmysql raises its client-error table text (`CR_SERVER_LOST`: "Lost connection to MySQL server during query"), which `rb_raise_mysql2_error` (`vendor/mysql2/0.5.6/ext/mysql2/client.c`) passes through via `mysql_error`. trails#10640 hand-wrote the libmysql text at two sites: the `writeTimeout` arm and `useResult`'s connection-loss listener.

## Acceptance criteria

- [ ] An error whose number comes from `CR_ERRNOS` carries libmysql's `ER(CR_*)` text for that number. The two hand-written "Lost connection to MySQL server during query" sites go through the same mapping.
- [ ] The existing mysql2 client specs that match `/Lost connection/` and `/MySQL server has gone away/` still pass.
