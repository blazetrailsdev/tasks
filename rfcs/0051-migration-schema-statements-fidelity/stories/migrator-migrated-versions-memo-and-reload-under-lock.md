---
title: "Memoize Migrator#migrated and reload it after taking the advisory lock"
status: ready
updated: 2026-07-28
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

Rails' `Migrator` memoizes the applied-version set and deliberately reloads it
_after_ acquiring the advisory lock
(`vendor/rails/activerecord/lib/active_record/migration.rb:1482-1490`,
`:1596-1604`):

```ruby
def migrated
  @migrated_versions || load_migrated
end

def load_migrated
  @migrated_versions = Set.new(@schema_migration.integer_versions)
end

def with_advisory_lock
  lock_id = generate_migrator_advisory_lock_id
  got_lock = connection.get_advisory_lock(lock_id)
  raise ConcurrentMigrationError unless got_lock
  load_migrated # reload schema_migrations to be sure it wasn't changed by another process before we got the lock
  yield
  ...
end
```

`record_version_state_after_migrating` then mutates that memo in place
(`migrated.delete(version)` / `migrated << version`, migration.rb:1554-1562),
so a single run reads the DB once and tracks its own writes in memory.

trails (`packages/activerecord/src/migration.ts`) has no memo:

- `async migrated()` and `async loadMigrated()` are both
  `return this._appliedVersions()` — two names for the same uncached query.
- `_appliedVersions()` issues a fresh `schemaMigration.allVersions()` round-trip
  on every call, and it is called from `runWithoutLock`, `migrateWithoutLock`'s
  dispatch, `_migrateUp`, `_migrateDown`, `rollback`, `pendingMigrations`,
  `getAllVersions`, `currentVersionReadOnly` and `isRan`.
- `_withAdvisoryLock` never calls `loadMigrated`, so the one call Rails makes
  _for correctness_ — refreshing after the lock is taken, in case another
  process migrated while we blocked — has no counterpart.

The missing reload is a real concurrency hole, not just an efficiency gap: two
migrators racing for the lock both compute their applied set before blocking,
and the loser proceeds on a stale view.

## Acceptance criteria

- `Migrator` carries a `@migrated_versions`-equivalent memo; `migrated()`
  returns it and `loadMigrated()` refreshes it, matching migration.rb:1482-1490
  rather than aliasing one query.
- `_withAdvisoryLock` calls `loadMigrated()` after the lock is acquired and
  before running the block (migration.rb:1601).
- `recordVersionStateAfterMigrating` updates the memo in place, mirroring
  migration.rb:1554-1562.
- A regression test shows a second Migrator that acquires the lock after a first
  one committed a version observes that version; it must fail on baseline.
