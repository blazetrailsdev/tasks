---
title: "active_storage:install copies the engine's migrations into the app (railties:install:migrations)"
status: done
updated: 2026-11-03
rfc: "0209-activestorage-port"
cluster: null
packages: ["activestorage", "activerecord", "trailties"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#9675
claim: "2026-11-03T17:21:49Z"
assignee: "active-storage-install-copies-migrations"
blocked-by: null
closed-reason: null
---

## Context

An application has no way to copy ActiveStorage's migrations into its own `db/migrate`. Rails does it in three layers:

- `active_storage:install` and `active_storage:update` (`vendor/rails/v8.0.2/activestorage/lib/tasks/activestorage.rake:3-26`). `update` sets `ENV["MIGRATIONS_PATH"] = "db/update_migrate"` and invokes `install`, which invokes `active_storage:install:migrations`.
- `<railtie_name>:install:migrations`, defined for every engine that `has_migrations?` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:660-676`, `:697`). It sets `ENV["FROM"]` and invokes `railties:install:migrations`.
- `railties:install:migrations` (`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/databases.rake:587-620`), which walks `Rails.application.migration_railties` and calls `ActiveRecord::Migration.copy` with `on_skip` / `on_copy`.

In trails, `ActiveRecord::Migration.copy` is ported (`packages/activerecord/src/migration.ts:1110`), and the migration sources ship in `packages/activestorage/src/db/migrate/` and `src/db/update-migrate/`. None of the three tasks exists: no `install:migrations` or `railties:install` appears in `packages/trailties/src` or `packages/activerecord/src`, and `packages/trailties/src/engine.ts` has no `rake_tasks` block or `hasMigrations`. Today a user must copy `20170806125915_create_active_storage_tables.ts` into their app by hand.

## Acceptance criteria

- [ ] `railties:install:migrations` is ported into the activerecord databases task file, with its `FROM`, `MIGRATIONS_PATH` and `DATABASE` arms and its skip/copy messages, over `Migration.copy` and `Application#migrationRailties`.
- [ ] `Engine` defines `<railtieName>:install:migrations` in its `rake_tasks` block when `hasMigrations` is true, as `engine.rb:660-676` does.
- [ ] `active_storage:install` and `active_storage:update` are ported from `activestorage.rake` and registered by the ActiveStorage engine.
- [ ] Running `trails active_storage:install` in a generated app copies the create-tables migration into `db/migrate` with a new timestamp, and a second run prints the skip NOTE. `active_storage:update` copies the update migrations.
- [ ] The Rails tests that cover these are ported (the `railties:install:migrations` cases in `vendor/rails/v8.0.2/railties/test/railties/engine_test.rb:95-200`).
