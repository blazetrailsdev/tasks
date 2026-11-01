---
title: "A pool's migrationContext migrates on that pool, not Base"
status: closed
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#9574
claim: "2026-11-01T14:56:30Z"
assignee: "attribute-rejects-a-name-that-shadows-base"
blocked-by: null
closed-reason: "Rails 8.0 Migrator also goes through migration_connection; keep Rails' behaviour. trailmap's tests keep pointing Base at the database."
---

StatsSyncRecord.connectionPool().migrationContext.migrate() raises ConnectionNotDefined when Base has no connection: Migrator#connection goes through DatabaseTasks.migrationConnection (activerecord/src/tasks/database-tasks.ts:751, src/migration.ts:1821), which leases Base. trailmap's test points Base at the database and removes it (test/lib/stats-sync.test.ts, test/models/stats-sync-records.test.ts). Expected: the context uses the pool it came from.
