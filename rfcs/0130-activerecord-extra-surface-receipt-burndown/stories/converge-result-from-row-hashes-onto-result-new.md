---
title: "Converge Result.fromRowHashes onto Result.new and a Result-holding query cache"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8055
claim: "2026-09-24T20:44:11Z"
assignee: "converge-model-mixin-plumbing-surface-remainder"
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-adapter-schema-and-result-helper-surface-remainder` for
the LOC ceiling. `Result.fromRowHashes` (`packages/activerecord/src/result.ts`)
still carries a `@noRailsEquivalent CONVERGEABLE` receipt. Rails only builds a
Result with `Result.new(columns, rows)` (`activerecord/lib/active_record/result.rb`).

Production callers:

- `connection-adapters/sqlite3/database-statements.ts` — Rails builds
  `ActiveRecord::Result.new(stmt.columns, stmt.to_a)`
  (`sqlite3/database_statements.rb:90,103`); trails can build
  `new Result(columns, rows.map((row) => columns.map((c) => row[c])))` from
  `stmt.columns()`.
- `connection-adapters/abstract/query-cache.ts` `selectAll` — the root cause is
  that trails' `Store` caches hash-row arrays where Rails' `cache_sql`
  (`abstract/query_cache.rb:278-298`) caches the `Result` itself and returns
  `result.dup`. Converging means `Store`, `lookupSqlCache`, `cacheSql` and
  `cacheNotificationInfoResult` hold `Result`s.

About 35 trails test call sites build fixtures with `Result.fromRowHashes`
(join-dependency, querying, mysql/pg schema-statements, connection-pool);
they need `new Result(...)` or a helper under `src/test-helpers/`.

## Acceptance criteria

- `Result.fromRowHashes` and its receipt are deleted.
- The query cache stores `Result`s as Rails does.
- `pnpm parity:api:extra:gate` stays green.
