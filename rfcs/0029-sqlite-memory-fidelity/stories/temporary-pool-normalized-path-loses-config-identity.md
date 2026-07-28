---
title: "withTemporaryPool loses config identity (and replaces the ambient pool) when the sqlite path is normalized"
status: in-progress
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5507
claim: "2026-07-28T13:56:44Z"
assignee: "temporary-pool-normalized-path-loses-config-identity"
blocked-by: null
closed-reason: null
---

## Context

PR #5299 fixed pool reuse in `DatabaseTasks.withTemporaryPool`
(`packages/activerecord/src/tasks/database-tasks.ts`) by passing the
`DatabaseConfig` OBJECT to `establishConnection`, matching Rails
(`tasks/database_tasks.rb:652` → `connection_handler.rb:139`), because
`ConnectionHandler`'s reuse check is reference equality
(`connection-adapters/abstract/connection-handler.ts:137`,
`existingPoolConfig.dbConfig === poolConfig.dbConfig`).

One gap remains. trails applies `_normalizeSQLitePath` (a trails invention with
no Rails counterpart — Rails does no path resolution here) before connecting.
When that helper actually rewrites a **relative** sqlite path it returns a NEW
hash, so the call site falls back to passing the plain hash:

```ts
const target = configuration === rawConfiguration ? config : configuration;
```

On that path `resolvePoolConfig` mints a fresh `HashConfig`, the identity check
cannot match, and the temporary pool once again REPLACES (and disconnects) the
ambient pool. For a file-backed DB that is survivable; for any config whose
database is relative it still reconnects needlessly, and the failure mode is the
same class of bug the PR fixed.

## Acceptance criteria

- [ ] Path normalization no longer costs config identity — e.g. normalize into
      a `DatabaseConfig` instance (or normalize at config-construction time) so
      `withTemporaryPool` always hands `establishConnection` an object the
      handler can recognize.
- [ ] The `configuration === rawConfiguration` reference-compare fallback at the
      `withTemporaryPool` call site is gone.
- [ ] A regression test covers a temporary pool over a **relative** sqlite path
      and asserts the ambient pool is reused, not replaced (fails on baseline).
