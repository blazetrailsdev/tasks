---
title: "F1 — prevent-writes + hot-compat + misc tail"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "core-residuals"
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). preventingWrites enforcement, schema-cache hot reload, lazy-connection query cache, timestamp parity, db tasks tail.

Counted `test:compare` skips covered by this story: **13** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- relation.ts or abstract-adapter.ts#executeMutation missing preventingWrites check for some query types
- timestamp.ts or attribute-methods/timestamp.ts missing Rails parity
- connection-adapters/abstract/connection-pool.ts or connection-adapters/abstract/connection-handler.ts missing Rails parity for pool lifecycle

### Skipped tests to un-skip

- `hot_compatibility_test.rb` → `hot-compatibility.test.ts` — **4** counted skips:
  - insert after remove_column
  - update after remove_column
  - cleans up after prepared statement failure in a transaction
  - cleans up after prepared statement failure in nested transactions
- `adapter_prevent_writes_test.rb` → `adapter-prevent-writes.test.ts` — **1** counted skips:
  - doesnt error when a select query has encoding errors
- `base_prevent_writes_test.rb` → `base-prevent-writes.test.ts` — **1** counted skips:
  - preventing writes applies to all connections in block
- `query_cache_test.rb` → `query-cache.test.ts` — **1** counted skips:
  - query cache with forked processes
  - query cache across threads
  - cache is available when using a not connected connection
  - query caching is local to the current thread
  - query cache is enabled in threads with shared connection
  - query cache is cleared for all thread when a connection is shared
  - threads use the same connection
- `timestamp_test.rb` → `timestamp.test.ts` — **1** counted skips:
  - index is created for both timestamps
- `tasks/database_tasks_test.rb` → `tasks/database-tasks.test.ts` — **2** counted skips:
  - raises an error when called with protected environment which name is a symbol
  - with multiple databases
- `primary_class_test.rb` → `primary-class.test.ts` — **2** counted skips:
  - application record shares a connection with active record by default
  - application record shares a connection with the primary abstract class if set
- `active_record_test.rb` → `active-record.test.ts` — **1** counted skips:
  - .disconnect_all! closes all connections

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
