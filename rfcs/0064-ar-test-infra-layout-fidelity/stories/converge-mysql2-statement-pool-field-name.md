---
title: "converge-mysql2-statement-pool-field-name"
status: claimed
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-29T17:25:44Z"
assignee: "converge-mysql2-statement-pool-field-name"
blocked-by: null
closed-reason: null
---

## Context

The advisory prepared-statements lane added by PR #5533
(`maria-prepared-tests` in `.github/workflows/ci.yml`, `ARCONN=mysql2` +
`MYSQL_PREPARED_STATEMENTS=1`) fails 9 tests in
`packages/activerecord/src/bind-parameter.test.ts`, all with
`TypeError: Cannot read properties of undefined (reading 'keys')` at
`bind-parameter.test.ts:110`.

The helper reads the pool off a fixed property name:

```ts
function statementCacheKeys(conn: any): string[] {
  return conn._statementPool.keys;
}
```

That resolves on `postgresql-adapter.ts:476` and `sqlite3-adapter.ts:318`,
which both name the field `_statementPool`. The mysql2 adapter names its pool
`_stmtPool` (`mysql2-adapter.ts:274`) and exposes it only through
`_statementPoolForTest()` (`mysql2-adapter.ts:382`), so the helper reads
`undefined` and every prepared-path assertion in the file throws.

Rails has no such split: every adapter stores its pool in `@statements`, and
`bind_parameter_test.rb:260-274` reads it via
`@connection.instance_variable_get(:@statements)` with no per-adapter
branching. The trails divergence is the `_stmtPool` name on mysql2.

Failing tests: `statement cache`, `statement cache with query cache`,
`statement cache with find`, `statement cache with find by`, `statement cache
with in clause`, `statement cache with sql string literal`, `binds are
logged`, `bind params to sql with prepared statements`, `bind params to sql
with unprepared statements`.

## Acceptance criteria

- One pool field name across the three adapters, matching Rails' single
  `@statements` ivar rather than keeping a mysql2-only alias.
- `bind-parameter.test.ts` reaches the pool the same way for every adapter —
  no adapter branching in the helper.
- The 9 tests pass under `ARCONN=mysql2 MYSQL_PREPARED_STATEMENTS=1`, and the
  sqlite3 / postgresql lanes stay green.
- Do NOT skip or rename the tests.
