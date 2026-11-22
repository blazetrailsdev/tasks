---
title: "Statement result#each reads its cast options per call"
status: done
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: trails#10595
claim: "2026-11-22T20:34:04Z"
assignee: "mysql2-statement-result-each-reads-its-cast-options-per-call"
blocked-by: null
closed-reason: null
---

## Context

`rb_mysql_result_each` (`vendor/mysql2/0.5.6/ext/mysql2/result.c:1060-1120`) reads `cast_booleans`, `database_timezone`, `application_timezone` and `cache_rows` from the options passed to `each`, for prepared-statement results too. Only `cast` is forced (`:1096-1098`, "`:cast is forced for prepared statements`"). trails#10567 made `Result#each` cast per call for `Client#query` results: `_query` keeps the driver-decoded cell strings, and `Result#fetchRow` (`packages/mysql2/lib/result.ts`) casts them through `Client#typeCast(opts)`. `Statement#execute` (`packages/mysql2/lib/statement.ts:47-58`) still casts at execute time through `client.options(...)`'s `typeCast`, because binary-protocol cells are not length-coded strings. As a result, options passed to `each` on a statement result have no effect.

## Acceptance criteria

- [ ] A `Statement#execute` result honors `castBooleans`, `databaseTimezone`, `applicationTimezone` and `cacheRows` given to `each`, and forces `cast` as result.c:1096 does. It warns where `cast: false` is passed, as the gem does.
- [ ] `packages/mysql2/test/client.trails.test.ts` covers the case.
