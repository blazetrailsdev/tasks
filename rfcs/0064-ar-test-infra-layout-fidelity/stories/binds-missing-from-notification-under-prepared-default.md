---
title: "sql.active_record payload loses the caller's binds under the prepared default"
status: done
updated: 2026-08-01
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: 5785
claim: "2026-08-01T01:53:48Z"
assignee: "binds-missing-from-notification-under-prepared-default"
blocked-by: null
closed-reason: null
---

## Context

The advisory prepared-statements lane (`maria-prepared-tests` in
`.github/workflows/ci.yml`, `ARCONN=mysql2` + `MYSQL_PREPARED_STATEMENTS=1`,
added by PR #5533) fails `binds are logged` in
`packages/activerecord/src/bind-parameter.test.ts:348`:

```text
AssertionError: expected undefined to be [ QueryAttribute{ name: 'id', … } ]
```

The test subscribes to `sql.active_record`, calls
`conn.execQuery(sql, "SQL", binds)`, then looks for the event whose
`payload.binds` is the very array it passed
(`subscriber.events.find((e) => e.payload.binds === binds)`). Under the
prepared default no such event is found, so `message` is `undefined`.

Rails' anchor (`bind_parameter_test.rb`, quoted at
`bind-parameter.test.ts:329-334`) is
`assert_equal binds, message[4][:binds]` — the `sql.active_record` payload must
carry the _same_ `QueryAttribute` objects handed to `exec_query`, distinct from
the driver primitives in `type_casted_binds`. So either the mysql2 prepared
path emits no `sql.active_record` for this query, or it emits one whose
`binds` is a different array (rebuilt/type-cast) than the caller's.

Passes on plain MariaDB, PostgreSQL and SQLite on the same commit; fails only
with `MYSQL_PREPARED_STATEMENTS` set.

## Acceptance criteria

- Determine whether the prepared path drops the notification entirely or
  replaces the `binds` array, and fix so the payload carries the caller's own
  `QueryAttribute` objects as Rails does.
- Green under `ARCONN=mysql2 MYSQL_PREPARED_STATEMENTS=1`; other lanes stay
  green.
- Do NOT skip or rename the test, and do not weaken the identity assertion to a
  deep-equality one without a Rails citation.
