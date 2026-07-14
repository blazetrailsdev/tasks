---
title: "converge-ddl-through-execute-drop-dirty-guard"
status: claimed
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-14T16:58:40Z"
assignee: "converge-ddl-through-execute-drop-dirty-guard"
blocked-by: null
closed-reason: null
---

## Context

Rails runs DDL through the public `execute`, which `dirties_query_cache` wires
(query_cache.rb:13); e.g. `add_column` is
`execute schema_creation.accept(add_column_def)`
(activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:636-641).

trails diverges: `abstract/schema-statements.ts` calls `this.adapter.executeMutation(...)`
at ~25 sites (417, 440, 458, 481, 521, 554, 569, 573, 582, 672, 685, 690, 843,
892, 917, 964, 976, 1082, 1800, …) plus adapter-specific overrides, instead of
`execute`. PR #4858 made DDL dirty the query cache by wiring `executeMutation`
with a `_writeDirtyDepth` re-entrancy guard (so CRUD funneling
`execInsert`/`execUpdate`/`execDelete` → `executeMutation` does not double-clear).
That guard is trails-only machinery with no Rails counterpart.

Converging DDL to route through the already-wired `execute` would drop the guard
entirely and match Rails' call shape — but `execute` and `executeMutation` are
distinct primitives: `executeMutation` runs `.run()` (returns affected-row count /
lastInsertRowid), enforces the readonly-write guard, and materializes transactions;
`execute` runs `.all()` and returns rows. Each of the ~25 schema methods currently
discards the `executeMutation` number. Swapping the primitive changes the driver
call, return type, prepared-statement caching of DDL, and readonly semantics
across all three adapters (sqlite3/postgresql/mysql2) — enough regression surface
that it was deliberately deferred out of #4858.

## Acceptance criteria

- [ ] Route DDL in `abstract/schema-statements.ts` (and adapter overrides) through
      the wired `execute` where Rails does, matching Rails' `schema_statements.rb`
      call shape, so DDL dirties the query cache without the `_writeDirtyDepth`
      guard.
- [ ] Remove `dirtiesQueryCacheUnlessNested` + `_writeDirtyDepth` /
      `withWriteDirtyDepth` from `abstract/query-cache.ts` once DDL no longer
      relies on the `executeMutation` wiring, reverting to the pre-#4858 shape.
- [ ] Keep the `times: 1` query-cache expiry tests green (no CRUD double-clear)
      and keep the DDL-clears assertion from #4858 (query-cache-ddl-dirties.trails.test.ts).
- [ ] Preserve executeMutation's readonly guard / transaction-materialization /
      row-count semantics for the CRUD write paths that legitimately use it.
