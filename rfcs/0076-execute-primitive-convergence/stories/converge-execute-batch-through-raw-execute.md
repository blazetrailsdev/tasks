---
title: "Route executeBatch through rawExecute (Rails execute_batch to raw_execute, not in dirties set)"
status: blocked
updated: 2026-08-09
rfc: "0076-execute-primitive-convergence"
cluster: null
deps:
  - unify-execute-mutation-into-perform-query-postgresql
  - unify-execute-mutation-into-perform-query-mysql2
deps-rfc: []
est-loc: 60
priority: 1
pr: null
claim: "2026-08-09T16:29:33Z"
assignee: "converge-execute-batch-through-raw-execute"
blocked-by: "rawExecute is unusable for batches on 2 of 3 adapters: it calls this.performQuery, which is assigned on ONE prototype only (postgresql-adapter.ts:5028) — sqlite3 (sqlite3-adapter.ts:515) and mysql2 (mysql2-adapter.ts:929) keep trails-shaped private _performQuery instead, so rawExecute throws NotImplementedError there. rawExecute also never calls log(), so routing batches through it would drop sql.active_record for every fixture load / truncate_tables / schema apply (Rails wraps perform_query in log, abstract/database_statements.rb:552-559) and take them out of support/ddl-profile.ts's execute/executeMutation leaf patches. Unblocks after wire-raw-execute-through-log (RFC 0076, status ready) plus a Rails-signature performQuery-on-prototype story for sqlite3+mysql2."
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

## Update 2026-08-09 (PR #6313) — sqlite3's share is done; blocker partly stale

sqlite3's `executeBatch` now routes through a sqlite3-local `rawExecute` that
DOES call `log()` and DOES carry `batch:`
(`combineMultiStatements` then `rawExecute(sql, name, [], false, false, false,
true, true)`), matching `sqlite3/database_statements.rb:126-129`. Its two
call-mismatch baseline rows (`combine_multi_statements`, `raw_execute`) are
deleted, and the `_inQueryTransformers` suppression flag is gone from that path
— batch statements stay uncommented because `raw_execute` never reaches
`preprocess_query`, which is how Rails gets it.

Remaining scope is therefore **PG + mysql2 + the abstract mixin**, and the
`blocked-by` is stale in two ways worth re-checking before claiming: the "drops
`sql.active_record`" half is answered for sqlite3 (its `rawExecute` logs), and
only the PG/mysql2 `performQuery` prototype wiring
(`wire-perform-query-on-sqlite3-mysql2-prototypes`) is still genuinely in the
way. The still-set flag on PG and the abstract is filed separately as
`pg-execute-batch-transformer-flag-spans-await` — it is a live concurrency
defect, not just a routing cleanup.
