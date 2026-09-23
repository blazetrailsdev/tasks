---
title: "Converge or relabel sync/async shim receipts no ratified section covers"
status: done
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: 6
pr: trails#8010
claim: "2026-09-23T18:59:05Z"
assignee: "relabel-invented-model-and-relation-helper-permanent-receipts"
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit. These sync/async shims carry
`@noRailsEquivalent PERMANENT`, but no ratified CLAUDE.md section covers them —
and in two cases CLAUDE.md says the opposite:

- `connection-adapters/abstract/connection-pool.ts:546` `acquireConnectionSync`
  — § "Schema reflection peeks at a warm cache", _Scope boundary_: the sync lease
  "stay[s] CONVERGEABLE and [is] owned by [its] own RFC".
- `connection-adapters/sqlite3/database-statements.ts:176` `acquireStatementLock`
  — § "The adapter lock defaults to a monitor" names "retiring SQLite's statement
  lock onto `withRawConnection`" as pending work; story
  `retire-sqlite-statement-lock-onto-with-raw-connection` (RFC 0123) is `ready`.
- `base.ts:955`, `connection-handling.ts:356` `adapterClassSync` — sync twin of
  `adapter_class` (`connection_handling.rb`); prior art
  `adapter-class-sync-swallows-the-pool-error-rails-raises` is `done` but the
  shim and its PERMANENT receipt remain.
- `connection-adapters/postgresql-adapter.ts:1025` `warmMaxIdentifierLength`,
  and `maxIdentifierLength` (`:1020`, `@missingRailsCall query_value — PERMANENT`)
  — `postgresql_adapter.rb:620-622` queries; prior art
  `converge-pg-max-identifier-length-sync` is `done`.
- `connection-adapters/mysql/schema-dumper.ts:168-185` `schemaCollation`,
  `extractExpressionForVirtualColumn` (`@missingRailsCall internal_exec_query /
query_value / quote / quote_column_name — PERMANENT`) — pre-warmed caches
  where `mysql/schema_dumper.rb:65-86` queries.
- `connection-adapters/sqlite3-adapter.ts:418,1443,1468` `whenClosed`,
  `completeAsyncConnect`, `openAsync`; `connection-adapters/postgresql-adapter.ts:875,1184`
  `transactionStatus`, `whenClosed`.
- `disable-joins-association-relation.ts:119,138,175` `count` / `calculate` /
  `pluck` — Rails' `disable_joins_association_relation.rb:13-33` overrides only
  `limit`/`first`/`last`; the sibling `deferred` in the same file is already
  receipted `CONVERGEABLE converge-model-mixin-plumbing-surface` for the same
  mechanism (that story is `done`).

## Acceptance criteria

- Each receipt is either removed by converging the member, or relabelled
  `CONVERGEABLE <story-id>` naming an open story that owns the convergence
  (filing that story if none exists).
- No receipt here remains PERMANENT; none cites a section that does not cover it.
