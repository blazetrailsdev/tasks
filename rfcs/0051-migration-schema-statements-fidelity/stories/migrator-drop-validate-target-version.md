---
title: "Drop the invented _validateTargetVersion from _migrateUp/_migrateDown"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5780
claim: "2026-08-01T01:01:11Z"
assignee: "migrator-drop-validate-target-version"
blocked-by: null
closed-reason: null
---

## Context

`Migrator._validateTargetVersion` (`packages/activerecord/src/migration.ts`,
called from `_migrateUp` / `_migrateDown`) raises `MigrationError` with
`Invalid target version: ... Must be a non-negative integer` for a target that
is not a non-negative integer. Rails has no such check anywhere in
`vendor/rails/activerecord/lib/active_record/migration.rb`: the only target
validation on the per-run Migrator is `invalid_target?`
(migration.rb:1524-1526), which raises `UnknownMigrationVersionError` when the
target is neither `0` nor a known migration version, checked once in
`migrate_without_lock` (migration.rb:1503-1505).

PR #5745 (dispatching `migrate` onto `up` / `down`) established that
`_validateTargetVersion` is unreachable from `migrate` — every input it would
reject is already rejected by the preceding `_invalidTarget` check — and
dropped the call there. The two remaining call sites in `_migrateUp` /
`_migrateDown` are the last of the invention.

## Acceptance criteria

- `_validateTargetVersion` is deleted; `_migrateUp` / `_migrateDown` rely on
  the `invalid_target?` port (`isInvalidTarget` / `_invalidTarget`) as Rails
  does, so a bad target raises `UnknownMigrationVersionError` rather than
  `MigrationError`.
- Any test asserting the `Invalid target version:` message is rewritten
  against the Rails error, or deleted if it covers a case Rails does not
  distinguish. Test names still match Rails verbatim.
- `pnpm parity:api` shows no new extra-surface entry for `migration.rb`.
