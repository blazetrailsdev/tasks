---
title: "mysql2 fetchRowStmt builds date/time cells from the binary fields, not a re-parsed string"
status: done
updated: 2026-11-23
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10640
claim: "2026-11-23T13:32:34Z"
assignee: "mysql2-local-infile-ports-infile-c"
blocked-by: null
closed-reason: null
---

## Context

`rb_mysql_result_fetch_row_stmt` (`vendor/mysql2/0.5.6/ext/mysql2/result.c`, DATE/TIME/DATETIME arms) builds `Date` / `Time` / `DateTime` from the `MYSQL_TIME` struct's fields. After trails#10609, `Result#fetchRowStmt` (`packages/mysql2/lib/result.ts`) gets these cells from `Statement#_execute`'s `typeCast` as `field.string()`. That string is npm mysql2's `packet.readDateTimeString` / `readTimeString` (`mysql2/lib/parsers/binary_parser.js` `wrap`). `fetchRowStmt` then re-parses it with a regex. That text round-trip has no gem counterpart.

## Acceptance criteria

- [ ] The prepared-statement date/time arms read the binary date fields as numbers (year, month, day, hour, minute, second, microsecond) and build the value from them, as `MYSQL_TIME` does. Any npm-driver reader this uses is cited.
- [ ] The statement.test.ts row-type-mapping specs and result.trails.test.ts "casts a prepared DATETIME(3)'s fraction as microseconds" still pass.
