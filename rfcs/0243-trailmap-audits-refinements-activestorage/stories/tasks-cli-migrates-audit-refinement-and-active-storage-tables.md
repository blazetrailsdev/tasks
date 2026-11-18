---
title: "tasks CLI: migrations for the Active Storage, audits and refinements tables"
status: ready
updated: 2026-11-18
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: storage
packages: ["activestorage", "activerecord"]
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** the tasks repo (`db/migrate/`). trailmap mirrors each migration
at the same version in its own stories.

## Context

trailmap's models in this RFC live on `Base`, the CLI's live `tasks.db`.
trailmap never migrates that file: `tasksEntry()` sets `databaseTasks: false`
(trailmap `config/database.ts:95-113`). The migration that reaches it is the
tasks repo's twin at the same version, run by `src/migrator.ts:17-24`. Every
trailmap `db/migrate` file says so
(`20261114000010_add_stage_to_stories.ts:3-8`). So the schema must land here
first. The RFC's Design § "Schema" has the columns.

## Acceptance criteria

- [ ] One migration that creates `active_storage_blobs`,
      `active_storage_attachments` and `active_storage_variant_records`,
      identical to trails
      `packages/activestorage/lib/db/migrate/20170806125915_create_active_storage_tables.ts`.
- [ ] One migration that creates `audits` (`slug`, `title`, `format`, `repo`,
      `written_at` not null, timestamps, unique `(repo, slug, written_at)`).
- [ ] One migration that creates `refinements` (`rfc_id` not null, `outcome`
      not null, `stories` integer, timestamps, index `(rfc_id, created_at)`),
      named to match whatever the RFC's Open question 1 settles.
- [ ] `ingest` and `export` ignore the three tables. A test migrates a scratch
      DB, ingests, and asserts that the tables are untouched.
- [ ] The versions are recorded in the PR body, for trailmap's mirrors.
