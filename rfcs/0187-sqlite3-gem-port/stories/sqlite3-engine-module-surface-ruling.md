---
title: "sqlite3-engine-module-surface-ruling"
status: draft
updated: 2026-11-25
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# sqlite3: rule on the engine modules' public surface outside the gem

## Context

With the `SqliteDriver` seam deleted, the per-engine modules under `packages/sqlite3/lib/engine/` still export names the sqlite3 gem has none of (`vendor/sqlite3/v2.7.3/lib/sqlite3/database.rb` has no engine object): `errors` in `better-sqlite3.ts`, `node-sqlite.ts`, `expo-sqlite.ts` and `libsql.ts`; `nodeSqlite` in `node-sqlite.ts`; `LibsqlReplicaOptions`, `replicaEngine`, `remoteEngine` and `buildReplicaOptions` in `libsql.ts`; `bindParameterIndex` / `bindParameterNames` in `bind-parameter-index.ts`. `replicaEngine`'s database carries `sync()` (libsql's embedded-replica pull), reached from AR as `raw._engine.sync()` (`packages/activerecord/test/cases/libsql-adapter.trails.test.ts`). Sibling engine helpers (`busy-handler.ts`, `statement-tail.ts`, `bind-value.ts`) are already `@noRailsEquivalent PERMANENT`.

Each of these carries `@noRailsEquivalent CONVERGEABLE <this story>`.

## Acceptance criteria

- [ ] Operator rules whether engine-module surface outside the gem is permanent (the engine is how trails stands in for the gem's C extension).
- [ ] If permanent: every receipt above becomes `@noRailsEquivalent PERMANENT` and this story closes `PERMANENT:`.
- [ ] Otherwise: each name is folded into the engine object or made module-private, and its receipt deleted.
