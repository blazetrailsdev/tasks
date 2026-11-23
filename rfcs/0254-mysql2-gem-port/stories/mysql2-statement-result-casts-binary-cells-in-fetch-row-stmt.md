---
title: "mysql2-statement-result-casts-binary-cells-in-fetch-row-stmt"
status: done
updated: 2026-11-23
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10609
claim: "2026-11-22T22:34:12Z"
assignee: "mysql2-result-stream-option-reads-the-driver-row-stream"
blocked-by: null
closed-reason: null
---

## Context

`rb_mysql_result_fetch_row_stmt` (`vendor/mysql2/0.5.6/ext/mysql2/result.c`) casts each prepared-statement cell straight from its `MYSQL_BIND` buffer. trails#10595 made a `Statement#execute` result cast per `#each` call. It does this with a `typeCast` in `Statement#_execute` (`packages/mysql2/lib/statement.ts`) that stores every binary-protocol cell as text: numeric types go through `String(next())` with `supportBigNumbers` / `bigNumberStrings`. `Result#fetchRow` then re-casts that text the way it casts text-protocol cells. JSON is read with `field.string("binary")`, because npm mysql2 reports a JSON column with charset 63 (binary) and its binary-row wrapper warns when `string()` is called with the field's default encoding.

That stringify-then-recast layer has no gem counterpart.

## Acceptance criteria

- [ ] A statement result casts its binary-protocol cells in a `fetchRowStmt` that mirrors `rb_mysql_result_fetch_row_stmt`'s per-type arms, without first stringifying them in `Statement#_execute`.
- [ ] The row-type-mapping specs in `packages/mysql2/test/statement.test.ts` still pass.
