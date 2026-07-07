---
title: "Move version-format/timestamp validation out of Migrator#validate to migration-load time (Rails parity)"
status: in-progress
updated: 2026-07-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: 48
pr: 4735
claim: "2026-07-07T13:25:50Z"
assignee: "migrator-validate-scope-to-name-version-dup-only"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #4570 (migrator-validate-nil-version-name-dup).

trails' `Migrator#validate` (packages/activerecord/src/migration.ts ~3151) runs
the per-migration **version-format** check (`Invalid migration version: ...`) and
the **timestamp** validation (`InvalidMigrationTimestampError`) inside
`validate()`.

In Rails these checks do NOT live in `Migrator#validate`
(vendor/rails/activerecord/lib/active_record/migration.rb:1557-1562, which only
does name-dup then version-dup via `group_by`). Version format/timestamp
validation happens at migration **load time** in
`MigrationContext#migrations` (migration.rb:1303-1308), before `validate` is
ever called. trails conflates the two by folding load-time validation into
`validate`.

This is a pre-existing conflation (not introduced by PR #4570) but is a genuine
Rails deviation worth tracking.

## Acceptance criteria

- [ ] Move the version-format and timestamp validation out of
      `Migrator#validate` to the migration-load path (trails' equivalent of
      `MigrationContext#migrations`), matching Rails' layering.
- [ ] `Migrator#validate` mirrors Rails: name-dup then version-dup only.
- [ ] No regression in existing migrator/migration validation tests.
