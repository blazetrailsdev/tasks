---
title: "Make Migrator#pending_migrations filter the direction-aware migrations reader"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5803
claim: "2026-08-01T17:35:41Z"
assignee: "pending-migrations-should-filter-the-direction-aware-migrations-reader"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Migrator#pending_migrations` filters the direction-aware `migrations`
reader, not the raw ivar
(`vendor/rails/activerecord/lib/active_record/migration.rb:1478-1481`):

```ruby
def pending_migrations
  already_migrated = migrated
  migrations.reject { |m| already_migrated.include?(m.version) }
end
```

trails (`packages/activerecord/src/migration.ts:2681-2684`, as merged by #5784)
still reaches past the getter:

```ts
async pendingMigrations(): Promise<MigrationProxy[]> {
  await this._ensureSchemaTable();
  const applied = await this.migrated();
  return this._migrations.filter((m) => !applied.has(m.version));
}
```

PR #5784 made `get migrations()` direction-aware (reversed when `isDown()`,
mirroring migration.rb:1471-1473), so `_migrations` and `migrations` now diverge
for any Migrator constructed with `direction: "down"` — `pendingMigrations`
returns ascending order where Rails returns descending. Before #5784 the two
were identical, so this was invisible.

`pendingMigrationsReadOnly` (same file) has the same `_migrations` reach-past and
should be considered together.

## Acceptance criteria

- `pendingMigrations` filters `this.migrations`, not `this._migrations`.
- `pendingMigrationsReadOnly` reviewed for the same fix (it is a trails-only
  read-only variant; converge it or justify the divergence at the call site).
- A test covers `pendingMigrations()` on a down-direction Migrator returning
  descending order. Rails' `migrator_test.rb:141` `test_finds_pending_migrations`
  is up-only, so a down case is trails-only and belongs in
  `migrator.trails.test.ts`.
- Check callers first: several sites (`forward`, CheckPending, schema-statements)
  call `pendingMigrations` on up-direction Migrators where behavior is unchanged,
  but confirm none depend on the ascending order for a down Migrator.
