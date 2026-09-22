---
title: "MySQL quote_string escapes without with_raw_connection's driver escape"
status: draft
updated: 2026-09-22
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractMysqlAdapter#quote_string` is
`with_raw_connection(allow_retry: true, materialize_transactions: false) { |connection| connection.escape(string) }`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:695-699`).
trails' `quoteString` (`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`)
hand-rolls the escape from a cached `NO_BACKSLASH_ESCAPES` flag and takes no lease, because
`withRawConnection` is async while `quoteString` is reached from synchronous quoting paths
(`Quoting#quote`, sanitization, the Arel visitor's `to_sql`). Same blocker as
`pg-quote-string-escapes-without-with-raw-connection`, for the MySQL adapters.

## Acceptance criteria

- `quoteString` escapes through the driver connection inside `withRawConnection`, as Rails does.
- The `@missingRailsCall with_raw_connection — CONVERGEABLE` receipt is removed.
