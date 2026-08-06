---
title: "rename_column_for_alter hand-warms database_version, a call Rails does not make"
status: blocked
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6146
claim: "2026-08-05T23:53:11Z"
assignee: "pg-schema-statements-abstract-signature-divergences"
blocked-by: "Still blocked AFTER its prerequisite merged. port-pool-server-version-retire-get-database-version-memo-guard landed in #6144, which re-spelled all three MySQL hand-warms as 'await this.pool.serverVersion(this)' but did NOT remove them — and could not. pool.serverVersion (abstract/connection-pool.ts:126-134) memoizes only the RESOLVED value and returns connection.getDatabaseVersion()'s Promise for MySQL, so the sync databaseVersion getter still cannot issue the round-trip Rails' reader does (abstract_adapter.rb:854-856). main itself still warms in renameColumnForAlter, renameIndex and checkConstraints, which is the proof. Removing the warm reds the MariaDB lane: connection.test.ts:318 'logs name rename column for alter' fails with 'databaseVersion is not available yet' (PR #6146, run 31058825999). The real blocker is the sync/async gap, not the pool memo: this cannot converge until databaseVersion can fetch synchronously or every caller becomes async. PR #6146 shipped the independent half — the body returns this.renameColumnSql(...) per abstract_mysql_adapter.rb:864, retiring one call-mismatch row."
closed-reason: null
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
