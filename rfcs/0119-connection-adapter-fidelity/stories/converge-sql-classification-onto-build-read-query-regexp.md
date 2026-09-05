---
title: "converge-sql-classification-onto-build-read-query-regexp"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/sql-classification.ts` is a
trails-only file holding `isWriteQuerySql` and `stripSqlComments`. Rails does the
same job with a per-adapter regexp built by
`ActiveRecord::ConnectionAdapters::AbstractAdapter.build_read_query_regexp`
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb`), which
each adapter feeds its own `READ_QUERY` constant into
(`sqlite3_adapter.rb`, `abstract_mysql_adapter.rb`, `postgresql_adapter.rb`),
and `#write_query?` matches against it.

trails' version is one global statement-keyword regexp plus a hand-written
comment stripper and a `WITH ... SELECT` arm, so it is not per-adapter at all
and does not track any adapter's `READ_QUERY`.

Both names carry `@noRailsEquivalent CONVERGEABLE` receipts pointing here
(RFC 0130, `receipt-connection-adapters-and-sqlite-drivers`). Callers today are
`connection-adapters/sqlite3-adapter.ts`,
`connection-adapters/abstract/database-statements.ts`,
`connection-adapters/abstract-adapter.ts` and
`connection-adapters/sqlite3/database-statements.ts`.

Related: `postgresql-write-query-invalid-encoding-arm` (same RFC) is about the
PostgreSQL `write_query?` override and should be read alongside this.

## Acceptance criteria

- `build_read_query_regexp` and each adapter's `READ_QUERY` constant are ported
  at their Rails names and homes, and `writeQueryQ` matches against them.
- `connection-adapters/sql-classification.ts` is deleted, its receipts with it.
- `pnpm parity:api:calls` / `:args` show no new rows; the three AR adapter lanes
  stay green.
