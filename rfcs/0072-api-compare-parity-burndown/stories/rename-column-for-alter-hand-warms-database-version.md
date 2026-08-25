---
title: "rename_column_for_alter hand-warms database_version, a call Rails does not make"
status: closed
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6146
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done on origin/main (311bff350). AC1: AbstractMysqlAdapter#renameColumnForAlter (abstract-mysql-adapter.ts:1781-1788) has no version warm and goes straight into supportsRenameColumn() -> renameColumnSql, matching abstract_mysql_adapter.rb:863-878 — shipped by PR #6146. AC2: the sibling hand-warms went with PR #6149 (fill the version memo at connection establishment); renameIndex (:711) and checkConstraints (:1011) read the sync predicates directly, and the one surviving await — isRowFormatDynamicByDefault, mysql/schema-statements.ts:171-180 — carries its remaining reason at the call site pointing at 0072/make-version-gated-predicates-async, which is what AC2 asks for. Nothing left to ship."
---

## Context

`AbstractMysqlAdapter#renameColumnForAlter` opens with an
`await this.getDatabaseVersion()` that Rails' `rename_column_for_alter`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:863-878`)
does not have — Rails goes straight to `supports_rename_column?`.

The warm is load-bearing in trails only because the port inverted where the
round-trip lives: Rails' `database_version` reader
(`abstract_adapter.rb:854-856` → `pool.server_version(self)`) issues the query
itself when unmemoized, so every predicate is callable at any time. trails'
`databaseVersion` is a sync getter that throws when cold (PR #6125 made that
throw reachable by removing the `?? -1` fallbacks), so each caller that might
run before `configureConnection` has to warm the memo by hand.

Same root cause as `port-pool-server-version-retire-get-database-version-memo-guard`
(RFC 0072) — this story is the caller-side cleanup that becomes possible once
the pool owns the memo, and should be scheduled after it.

## Converged shape

With `pool.server_version` owning the fetch, `renameColumnForAlter` loses its
warm line and reads as Rails does, straight into the `supportsRenameColumn()`
branch. Sweep for sibling hand-warms introduced for the same reason
(`Mysql2Adapter#configureConnection`'s pre-super `await getDatabaseVersion()` is
the other known one, though that one has a genuine sync/async justification and
may survive).

## Acceptance criteria

- [ ] `renameColumnForAlter` has no `getDatabaseVersion()` warm; body matches
      `:863-878` branch for branch.
- [ ] Any other hand-warm added solely to keep the sync getter from throwing is
      removed or has its remaining reason cited at the call site.
- [ ] MySQL/MariaDB lanes green, including the pre-8.0.3 CHANGE fallback path.
