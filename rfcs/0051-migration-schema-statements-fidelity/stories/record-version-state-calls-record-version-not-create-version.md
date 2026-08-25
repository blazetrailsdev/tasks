---
title: "record_version_state_after_migrating calls recordVersion where Rails calls create_version"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6204
claim: "2026-08-07T21:44:45Z"
assignee: "converge-fixture-teardown-delete-onto-a-live-connection"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `record_version_state_after_migrating` in PR #6195
(`execute-migration-in-transaction-split-into-invented-run-migration`), which
removed that method's invented `direction` parameter so it reads `down?` off the
Migrator as Rails does. The remaining divergence in the same three-line body is
the name of the write it delegates to.

`vendor/rails/activerecord/lib/active_record/migration.rb:1565-1573`:

```ruby
def record_version_state_after_migrating(version)
  if down?
    migrated.delete(version)
    @schema_migration.delete_version(version.to_s)
  else
    migrated << version
    @schema_migration.create_version(version.to_s)
  end
end
```

`packages/activerecord/src/migration.ts` calls
`this._schemaMigration.recordVersion(String(version))` for the else arm, where
Rails calls `create_version`. The delete arm already matches
(`deleteVersion` ↔ `delete_version`). `SchemaMigration` has **both** spellings —
`createVersion` exists and is used by tests
(e.g. `migrator.trails.test.ts` calls `schemaMigration.createVersion("2")`), so
`recordVersion` looks like a second name for the same operation rather than a
missing port.

This is carried as a baseline row today:
`record_version_state_after_migrating | create_version` in
`scripts/api-compare/call-mismatches-exclude/activerecord/migration.json`.

`SchemaMigration#create_version` is
`vendor/rails/activerecord/lib/active_record/schema_migration.rb` (the
`create_version` writer); confirm whether `recordVersion` is a redundant alias of
it before deleting — per the "novel extra may be a redundant alias" pattern, read
the body first, because deleting the alias beats keeping both names.

## Converged shape

`recordVersionStateAfterMigrating` calls
`this._schemaMigration.createVersion(String(version))`
(`migration.rb:1571`). If `recordVersion` turns out to be a redundant alias of
`createVersion` with no Rails counterpart, delete it and migrate its call sites
to the Rails name; if it has a distinct body, port whichever one Rails actually
has and retire the other. Then delete the
`record_version_state_after_migrating | create_version` baseline row by hand
(only-shrink — do not `--write`/reseed).

## Acceptance criteria

- [ ] `recordVersionStateAfterMigrating`'s else arm calls the Rails-named writer
      (`migration.rb:1571`).
- [ ] `recordVersion` is gone, or justified at its definition if it is a real
      distinct Rails method; `pnpm parity:api:extra --package activerecord` does not gain
      surface.
- [ ] The `record_version_state_after_migrating | create_version` baseline row is
      deleted by hand.
- [ ] Migrator, migration, multi-db-migrator and CLI suites green; no test names
      change.
