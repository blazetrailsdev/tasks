---
title: "Route executeBatch through rawExecute (Rails execute_batch to raw_execute, not in dirties set)"
status: blocked
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
blocked-by: "Mis-specified: premise that rawExecute is a viable batch route is false. rawExecute (abstract/database-statements.ts:1847) funnels withRawConnection -> performQuery, but performQuery is assigned on ONE prototype only (postgresql-adapter.ts:5244). sqlite3 never imports its own exported performQuery (sqlite3/database-statements.ts:161 is dead alongside its dead executeBatch:222); mysql2 calls mysql2PerformQuery inline in a single read path (mysql2-adapter.ts:1207) and never assigns it. So routing the abstract executeBatch (the LIVE path for both sqlite3 and mysql2) through rawExecute hits the throwing abstract performQuery -> NotImplementedError on 2 of 3 adapters. Second blocker: trails has no log() helper at all -- Rails wraps perform_query in log(...) inside raw_execute (abstract/database_statements.rb:552-559), which both emits sql.active_record and creates the notification_payload perform_query mutates. trails instead instruments inside each adapter's execute/executeMutation body (e.g. sqlite3-adapter.ts:568-605). rawExecute therefore emits NO sql.active_record and passes no notificationPayload, so even the PG-only slice would silently drop batch instrumentation -- failing this story's own acceptance criterion and breaking ddl-profile.ts, which deliberately patches only execute/executeMutation as 'the two leaf primitives' that executeBatch re-dispatches through. readonly/preventWrites and materializeTransactions likewise live in executeMutation bodies, not in rawExecute. Prerequisite: unify-execute-mutation-into-perform-query (RFC 0023, status ready) must wire a real performQuery + the log() instrumentation seam on sqlite3 and mysql2 first; only then is rawExecute a funnel that preserves write-check/instrumentation/bind-casting/batch:true. This mirrors converge-ddl-through-execute-drop-dirty-guard, blocked 2026-07-14 for the same root cause. Re-open after the unify story lands."
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
