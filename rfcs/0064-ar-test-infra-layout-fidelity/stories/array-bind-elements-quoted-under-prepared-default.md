---
title: "Array bind elements render as quoted strings under the prepared default"
status: done
updated: 2026-08-01
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: 5779
claim: "2026-08-01T00:50:41Z"
assignee: "array-bind-elements-quoted-under-prepared-default"
blocked-by: null
closed-reason: null
---

## Context

The advisory prepared-statements lane (`maria-prepared-tests` in
`.github/workflows/ci.yml`, `ARCONN=mysql2` + `MYSQL_PREPARED_STATEMENTS=1`,
added by PR #5533) fails two tests in
`packages/activerecord/src/bind-parameter.test.ts`, `bind params to sql with
prepared statements` and `bind params to sql with unprepared statements`, both
at `assertBindParamsToSql` (`bind-parameter.test.ts:444`):

```text
Expected: "SELECT `authors`.* FROM `authors` WHERE `authors`.`id` IN (1, 2, 3)"
Received: "SELECT `authors`.* FROM `authors` WHERE `authors`.`id` IN ('1', '2', '3')"
```

`conn.toSql` on a `Nodes.BoundSqlLiteral` whose single bind is the array
`[1, 2, 3]` renders the integers as quoted strings. The expected form comes
from the test's own `bindParams(conn, [1, 2, 3])` helper, so the two sides
disagree about whether an array bind's elements keep their numeric type.

Both tests pass on the plain MariaDB, PostgreSQL and SQLite lanes on the same
commit and fail only when `MYSQL_PREPARED_STATEMENTS` is set, so the trigger is
the run-wide prepared default rather than the adapter generally. Note the
second failing test is the _unprepared_ variant: it is guarded by
`ctx.skip(!conn.preparedStatements)`-style toggling in the same file, so part
of the investigation is whether the per-test toggle actually restores the
unprepared path when prepared is the process-wide default.

Rails' anchor is `bind_parameter_test.rb` `test_bind_params_to_sql`, which
asserts the unquoted `IN (1, 2, 3)` form.

## Acceptance criteria

- Root-cause why array bind elements are quoted as strings under the prepared
  default; fix in the quoting/collector path, not by loosening the assertion.
- Both tests green under `ARCONN=mysql2 MYSQL_PREPARED_STATEMENTS=1`, with the
  sqlite3 / postgresql / plain-mysql2 lanes still green.
- Do NOT skip or rename the tests.
