---
title: "Retire the trails-only databaseVersion warm-ups from ported bodies"
status: done
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6149
claim: "2026-08-06T01:33:05Z"
assignee: "date-assertion-value-mark-vs-temporal-returns"
blocked-by: null
closed-reason: null
---

## Context

Shipped in #6144 (`port-pool-server-version-retire-get-database-version-memo-guard`).
The version memo now lives on the pool
(`pool_config.rb:39-41`, `abstract/connection_pool.rb:30-32`) and
`AbstractAdapter#databaseVersion` reads `pool.serverVersion(this)`
(`abstract_adapter.rb:854-856`).

What Rails does NOT have is the warm-up call that precedes every version-gated
predicate in trails. Rails' `database_version` is sync and fetches on demand;
trails' `getDatabaseVersion` is a real await, so the sync reader throws unless
someone awaited the pool memo first. That forced these trails-only warms, none
of which has a Rails counterpart:

- `abstract/schema-statements.ts` — `createTable` (~line 418), `addIndex` (~537)
- `abstract-mysql-adapter.ts` — `renameIndex` (~724), `checkConstraints` (~1039),
  `renameColumnForAlter` (~1819)
- `mysql2-adapter.ts` — `configureConnection` (~1735)
- `schema-dumper.ts` — `checkConstraintsInCreate` (~779)
- `insert-all.ts` — the `uniqueBy` path (~456)
- `support/schema-types.ts` — `supportsExpressionIndex` (~228)
- `support/load-schema-helper.ts` — `loadMysql2SpecificSchema` (~348)

Rails' equivalents (`abstract_mysql_adapter.rb:545`, `schema_statements.rb`'s
`create_table` / `add_index`, `mysql2_adapter.rb`'s `configure_connection`) call
none of them. Every one is extra surface in a ported body, and the
`configureConnection` warm is what made the pool memo deadlock-prone in the
first place (fixed in #6144 by memoizing only the resolved value).

## Converged shape

Give `databaseVersion` a shape the sync predicates can read without a
per-call-site warm — e.g. the pool memo is filled once when the connection is
established (Rails' `configure_connection` → `check_version` ordering does
exactly this, `abstract_adapter.rb:1212`), after which every
`supports_*?` read is a plain sync memo hit and all eleven warms delete.

## Acceptance criteria

- [ ] The version memo is filled on connection establishment, at the point
      `abstract_adapter.rb:1212` fills it, without re-entering the connect path.
- [ ] All warm-up calls listed above are deleted; the ported bodies match their
      Rails counterparts call-for-call.
- [ ] `pnpm parity:api:calls` rows for those methods shrink, not grow.
- [ ] All adapter lanes green (the MariaDB lane is the one that catches a
      re-entrant version read; see #6144).
