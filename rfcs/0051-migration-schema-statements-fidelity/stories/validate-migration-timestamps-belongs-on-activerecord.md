---
title: "validate_migration_timestamps is an ActiveRecord config, not a Migrator static"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 70
pr: 6119
claim: "2026-08-05T03:44:59Z"
assignee: "postgresql-active-issues-the-rails-liveness-query"
blocked-by: null
closed-reason: null
---

## Context

Rails reads `ActiveRecord.validate_migration_timestamps` inside
`MigrationContext#validate_timestamp?`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1378-1380`):

```ruby
def validate_timestamp?
  ActiveRecord.timestamped_migrations && ActiveRecord.validate_migration_timestamps
end
```

trails has the first half right — `ActiveRecord.timestampedMigrations` lives on
the config module (`packages/activerecord/src/ar-config.ts:344`) — but the
second half is a static on `Migrator`:

```ts
return ActiveRecord.timestampedMigrations && Migrator.validateMigrationTimestamps;
```

`Migrator.validateMigrationTimestamps` (`packages/activerecord/src/migration.ts`)
has no Rails counterpart; Rails' `Migrator` carries only `migrations_paths` and
`current_version` as statics (`migration.rb:1404+`). PR #5820 moved
`validate_timestamp?` onto `MigrationContext` where Rails has it but left the
config read pointing at the `Migrator` static, since flipping it touches the
existing test callers and was out of that story's scope.

## Acceptance criteria

- [ ] `validateMigrationTimestamps` lives on `ActiveRecord` (ar-config.ts)
      alongside `timestampedMigrations`, with the same getter/setter shape.
- [ ] `MigrationContext#isValidateTimestamp` reads both from `ActiveRecord`.
- [ ] `Migrator.validateMigrationTimestamps` is gone; its test callers
      (`migrator.test.ts`, `migration-context.trails.test.ts`) are updated.
- [ ] Existing test names are preserved.
