---
title: "adapter-connection-failure-error-classification"
status: ready
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by `converge-adapter-connection-test-one-schema` (RFC 0048) porting
Rails' `AdapterConnectionTest` (`vendor/rails/activerecord/test/cases/adapter_test.rb`).

After a remote disconnect, Rails raises `ActiveRecord::ConnectionFailed` for a
severed-connection query (retryable classification), so idempotent SELECTs are
retried and reconnect, while non-retryable queries surface `ConnectionFailed`.

trails diverges per adapter:

- PostgreSQL: a severed connection maps to `ConnectionNotEstablished`, not
  `ConnectionFailed`. This is a documented node-pg limitation
  (`postgresql-adapter.ts:4060-4072`): node-pg is pure JS with no libpq layer,
  so it cannot reproduce Rails' `translate_exception` split
  (`postgresql_adapter.rb:801-821`) that keys on a libpq `PQerrorMessage`
  trailing newline. Because `ConnectionNotEstablished` is not in the retryable
  set, the idempotent-SELECT retry + transaction-restore-on-query behavior
  differs from Rails too.
- MySQL/MariaDB: the mysql2 driver's client-side "Can't add new command when
  connection is in closed state" error is not translated to any ActiveRecord
  error, surfacing raw instead of `ConnectionFailed`.

Blocked `AdapterConnectionTest` cases (checked in verbatim, `it.skip` with a
pointer to this story): "querying after a failed non-retryable query restores
and succeeds", "queries containing SQL fragments are not retried", "queries
containing SQL functions are not retried", "dirty transaction cannot be
restored after remote disconnection", "querying a 'clean' long-failed
connection restores and succeeds", "querying a 'clean' recently-used but
now-failed connection skips verification", "quoting a string on a 'clean'
failed connection will not prevent reconnecting", "idempotent SELECT queries
are retried and result in a reconnect", "#find and #find_by queries with known
attributes are retried and result in a reconnect", "#execute is retryable".

## Acceptance criteria

- [ ] A severed connection surfaces a retryable connection error consistent
      with Rails' `ConnectionFailed` (or a documented, test-visible equivalent)
      on PostgreSQL and MySQL/MariaDB, so idempotent queries retry+reconnect and
      non-retryable queries raise the connection error rather than a raw driver
      error.
- [ ] Un-skip the listed `AdapterConnectionTest` cases; they pass verbatim on
      PG and MySQL/MariaDB.
- [ ] No regression to the passing AdapterConnectionTest cases.
