---
title: "Route executeBatch through rawExecute (Rails execute_batch to raw_execute, not in dirties set)"
status: claimed
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-15T11:41:13Z"
assignee: "converge-execute-batch-through-raw-execute"
blocked-by: null
closed-reason: null
---

## Context

Rails' `execute_batch` funnels `raw_execute` on every adapter
(abstract/database_statements.rb:594-597, postgresql/database_statements.rb:195-197,
mysql2/database_statements.rb:17-21, sqlite3/database_statements.rb:126-129), and
`raw_execute` is deliberately OUTSIDE the `dirties_query_cache` set
(abstract/query_cache.rb:13-15) — that is why batch statements (fixture loading,
`truncate_tables`, schema application) leave the query cache intact, with no
counter anywhere.

trails' `executeBatch` bodies instead loop over the cache-wired `execute`
(postgresql/database-statements.ts, mysql2/database-statements.ts — dead, uses the
abstract mixin) or `executeMutation` (abstract/database-statements.ts:1980, used by
sqlite + mysql2; sqlite3/database-statements.ts:222 is dead — only PG assigns its
own `executeBatch` at postgresql-adapter.ts:2102). After PR 4858 wired
`executeMutation` (leaf) with `dirtiesQueryCacheUnlessNested`, a bare `executeBatch`
at depth 0 clears the cache per statement — a Rails deviation (harmless: idempotent,
batches run outside `cache` blocks). PR 4858 briefly bracketed the `_writeDirtyDepth`
guard around the batch bodies to suppress this, but that was reverted (the guard is
instance-scoped and mis-fires under concurrent writes; see the round-6 review on
PR 4858) — leaving the counter only at the `executeMutation` leaf.

trails already exports the unwired `rawExecute` (abstract/database-statements.ts:1847;
`AbstractAdapter#rawExecute`), which is what `execute`/`executeMutation` build on.

## Acceptance criteria

- [ ] Route every `executeBatch` body (abstract, and PG's `pgExecuteBatch`) through
      the unwired `rawExecute` instead of the cache-wired `execute` / `executeMutation`,
      matching Rails' `execute_batch` → `raw_execute` — so batch statements no longer
      dirty the query cache on any adapter, with no `_writeDirtyDepth` involvement.
- [ ] Verify `rawExecute` preserves what the batch path needs: write-check / readonly
      behavior, `sql.active_record` instrumentation, bind casting, and the
      `batch: true` / multi-statement handling (`combineMultiStatements`). Reconcile
      any signature/instrumentation gap vs the current `execute`/`executeMutation` route.
- [ ] Delete the dead `executeBatch` definitions that no adapter assigns
      (sqlite3/database-statements.ts, mysql2/database-statements.ts) or wire them,
      so the tree has one live path per adapter.
- [ ] Add a test that a batch (fixture load / `truncate_tables`) inside an enabled
      `cache` block leaves the cache intact, on all adapters.
