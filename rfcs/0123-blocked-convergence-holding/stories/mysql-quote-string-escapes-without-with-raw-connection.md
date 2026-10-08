---
title: "MySQL quote_string escapes without with_raw_connection's driver escape"
status: closed
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
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
closed-reason: 'PERMANENT: MySQL quote_string cannot take with_raw_connection. It is reached synchronously from Quoting#quote, Sanitization and the Arel visitor behind Relation#to_sql, so it escapes in process against the warmed NO_BACKSLASH_ESCAPES state (trails CLAUDE.md § "Adapter facts are prewarmed and peeked").'
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
