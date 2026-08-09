---
title: "Migrator#currentVersion auto-creates schema_migrations"
status: draft
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Migrator#currentVersion` (`packages/activerecord/src/migration.ts:2559`) calls
`_ensureSchemaTable()` before reading, so asking for the current version
**creates** `schema_migrations` as a side effect. Rails' `Migrator#current_version`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1290`) is just
`get_all_versions.max || 0`, and `get_all_versions` returns `[]` when
`schema_migration.table_exists?` is false — it never creates anything.

trails papered over this with a second method, `Migrator#currentVersionReadOnly`
(`migration.ts:2586`), whose own JSDoc says it "Matches Rails' `current_version`
exactly" and that the divergent `currentVersion` "keeps the legacy auto-create
path to stay compatible with internal callers that rely on it". So the faithful
behaviour exists but sits behind a trails-invented name, while the Rails-named
method is the deviant one.

Surfaced while moving the DatabaseTasks environment checks off `Migrator`
(#5861): the deleted `Migrator#lastStoredEnvironment` had to call
`currentVersionReadOnly()` precisely because the Rails-named `currentVersion`
would have created the table during a read-only guard.

Remaining callers of the read-only variant: `tasks/database-tasks.ts:1037` and
`packages/trailties/src/commands/db.ts:716`.

## Acceptance criteria

- [ ] `Migrator#currentVersion` does not create `schema_migrations` — it reads
      through `getAllVersions()` and returns 0 when the table is absent, per
      `migration.rb:1290`.
- [ ] `currentVersionReadOnly` is deleted; its two callers use `currentVersion`.
- [ ] The internal callers that relied on the auto-create side effect call
      `_ensureSchemaTable()` explicitly where they genuinely need the table,
      rather than depending on a reader to create it.
- [ ] Existing migrator/migration-context suites pass unchanged.
