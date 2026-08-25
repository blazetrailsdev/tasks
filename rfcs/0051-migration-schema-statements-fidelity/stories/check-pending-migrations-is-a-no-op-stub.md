---
title: "Migration.checkPendingMigrations is a no-op stub; port migration.rb:739-746"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6162
claim: "2026-08-07T01:08:29Z"
assignee: "check-pending-migrations-is-a-no-op-stub"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Migration.check_pending_migrations`
(`vendor/rails/activerecord/lib/active_record/migration.rb:739-746`) is a real
method: it reads `pending_migrations`, and when the list is non-empty raises
`PendingMigrationError.new(pending_migrations: migrations)`. `check_all_pending!`
(`migration.rb:714`) and `CheckPending#call`'s watcher block (`migration.rb:660`)
both route through it.

trails' counterpart, `packages/activerecord/src/migration.ts`
`Migration.checkPendingMigrations`, is a no-op stub whose body is two comment
lines saying "in a full Rails app this would check all database configs; here
it's a no-op; use Migrator.pendingMigrations() directly". `checkAllPendingBang`
and `loadSchemaIfPendingBang` both await it, so all three are effectively dead.

Because it is a stub, trails' `CheckPending` detects pending migrations itself
through invented `migrator` / `pendingConnection` / `migrations` constructor
options rather than by calling this method the way Rails does. That is the
direct blocker on
[[check-pending-has-no-file-update-checker-watcher]] (blocked), which cannot
converge `call` onto Rails' shape while the method it is supposed to call does
nothing.

Surfaced while shipping #6157.

## Converged shape

`migration.rb:739-746`:

    def check_pending_migrations # :nodoc:
      migrations = pending_migrations
      if migrations.any?
        raise PendingMigrationError.new(pending_migrations: migrations)
      end
    end

Port it against the real pending-migration lookup (`pending_migrations`,
`migration.rb:728-737`, which walks `Base.configurations.configs_for` and each
config's `MigrationContext`), so `checkAllPendingBang` and
`loadSchemaIfPendingBang` stop being no-ops too.

## Acceptance criteria

- `Migration.checkPendingMigrations` raises `PendingMigrationError` with the
  pending list when any migration is pending, and returns otherwise — no stub
  body, no comment standing in for the implementation.
- `pendingMigrations` resolves migration paths from the database configs the
  way `migration.rb:728-737` does, not from a caller-supplied list.
- `checkAllPendingBang` / `loadSchemaIfPendingBang` inherit the real behaviour.
- Tests mirror `vendor/rails/activerecord/test/cases/migration/pending_migrations_test.rb`
  verbatim by name.
