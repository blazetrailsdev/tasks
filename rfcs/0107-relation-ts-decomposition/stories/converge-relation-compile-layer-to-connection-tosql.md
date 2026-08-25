---
title: "converge-relation-compile-layer-to-connection-tosql"
status: closed
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
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
closed-reason: "Duplicate of converge-relation-to-sql-compile-layer, which pre-dates it, is estimated (400 LOC), already deps on converge-relation-build-arel-single-builder, and enumerates a strictly larger member list. Filed before I spotted the existing story; consolidating there."
---

## Context

Rails compiles a relation's Arel through the connection in one line:
`model.with_connection { |c| c.unprepared_statement { c.to_sql(arel) } }`
(`vendor/rails/activerecord/lib/active_record/relation.rb:1217-1218`), and
`to_sql_and_binds` / `to_sql` live on the adapter
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:31-45`).

trails hangs a bespoke compile layer off `relation.ts` instead, with no Rails
counterpart:

- `_compileSelectSql` — compiles a SelectManager, sets `_lastSelectBinds` /
  `_lastSelectRetryable` / `_lastSelectPreparable`
- `_compileAstWithBinds` — returns `[sql, binds]` for an Arel node
- `_typeCastBinds`
- `_applyBindLimitFallback`
- `_arelVisitor` / `_selectVisitor` — visitor resolution off the adapter
- `_toSqlViaConnection` — the one that IS close to `relation.rb:1217-1218`

PR #6593 (`converge-relation-build-arel-single-builder`) retired the _builder_
half of this cluster — `relation.ts` now has exactly one Arel builder, the
`build_arel` port at `relation/query-methods.ts` `buildArel()`. That story
explicitly deferred the compile half to this one.

Call sites after #6593: `_toSql` (`_compileSelectSql(this.buildArel())`),
`_buildEagerSql`, pluck, `execMainQuery`, and `toSql`
(`_toSqlViaConnection`).

## Acceptance criteria

- The Arel→SQL step in `relation.ts` goes through the adapter's `toSql` /
  `toSqlAndBinds` at the Rails call site, mirroring `relation.rb:1217-1218`
  and `database_statements.rb:31-45`, rather than a relation-private compile
  helper.
- `_compileSelectSql`, `_compileAstWithBinds`, `_typeCastBinds`,
  `_applyBindLimitFallback`, `_arelVisitor`, `_selectVisitor` are deleted, not
  renamed. Anything real they carried (bind type-casting, retryability,
  preparability) is restored in the Rails-named adapter method that owns it.
- The `_lastSelectBinds` / `_lastSelectRetryable` / `_lastSelectPreparable`
  side-channel is either traced to a Rails equivalent or removed with its
  consumers converged.
- SQL output unchanged; `pnpm parity:api:calls` / `:args` clean, `parity:api`
  and `parity:test` deltas non-negative.
