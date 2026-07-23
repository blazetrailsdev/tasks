---
title: "Enrich queryParser-rebuilt MismatchedForeignKey with referenced column type"
status: in-progress
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5145
claim: "2026-07-23T13:49:41Z"
assignee: "mismatched-fk-query-parser-rebuild-enrichment"
blocked-by: null
closed-reason: null
---

## Context

PR #5134 ported the query_parser-aware `MismatchedForeignKey#set_query`
overload (Rails errors.rb:275-289). On the sql-less translation path
(`translateExceptionClass(e, null, null)` →
`AbstractMysqlAdapter#mismatchedForeignKey` else-branch,
packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:1563),
the rebuilt exception gets FK **names** from
`mismatchedForeignKeyDetails` but never the referenced column's SQL type:
Rails' `mismatched_foreign_key_details`
(abstract_mysql_adapter.rb:978-999) fetches `primary_key_column` synchronously
via `column_for`, so its rebuilt message is fully detailed. Trails defers the
type lookup to the async `_enrichMismatchedForeignKey`
(abstract-mysql-adapter.ts:1628), which runs at translate time — before
`setQuery` — when `fkDetails` is still empty, so it's skipped and the rebuilt
exception keeps the generic fallback message (names present in `fkDetails`
but no `primaryKeySqlType`).

## Acceptance criteria

- MismatchedForeignKey errors rebuilt via the queryParser path carry the
  full Rails-detailed message ("Column `x` on table `y` does not match ...
  which has type `...`"), e.g. by re-running enrichment after `log()`'s
  `setQuery` rebuild (mysql2-adapter.ts `_translateAndEnrich` ordering), or
  another approach that keeps errors.ts faithful.
- Covered by a test on the sql-less translation path.
