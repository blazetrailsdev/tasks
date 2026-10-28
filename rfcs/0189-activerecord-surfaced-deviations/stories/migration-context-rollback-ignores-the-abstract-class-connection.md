---
title: "MigrationContext rollback for a connectsTo class runs on the primary connection"
status: draft
updated: 2026-10-28
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

Surfaced by trailmap#90 (`test/controllers/probes-controller.test.ts`, hub head check).

Calling `MigrationContext#rollback` for `db/hub-migrate` in-process, with `Hub` (a `connectsTo` Postgres abstract class) connected, ran against the primary SQLite connection instead of Hub's. trailmap's test works around it by deleting and re-inserting the `schema_migrations` row.

Expected (Rails): a MigrationContext built from `Hub.connection_pool.migration_context` migrates/rolls back on Hub's connection. Reproduce in activerecord before fixing; the repro was not reduced in trailmap.
