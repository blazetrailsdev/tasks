---
title: "activerecord: PendingMigrationError, NoEnvironmentInSchemaError and load_schema messages print the trails command line with Rails' env arms"
status: ready
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
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

trails#8611 settled the trails spelling of a Rails command line in an error message: `bin/rails db:environment:set` is `bin/trails db environment:set` (the `db` command with its `environment:set` subcommand, `packages/trailties/src/commands/db.ts`), and `RAILS_ENV=` is `TRAILS_ENV=`, appended only on the `defined?(Rails.env)` arm as a `TopLevel.Trails !== undefined` read (`EnvironmentMismatchError`, `packages/activerecord/src/migration.ts`, mirroring `vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:216-228`).

Three sibling messages still print the Ruby spelling, and two differ from Rails in shape:

- `PendingMigrationError#detailedMigrationMessage` (`migration.ts`, at the `detailed_migration_message` name) prints `bin/rails db:migrate` and appends `RAILS_ENV=${env}` (after a space) on `env !== "development" && env !== "test"`, reading `Migration.env()`. Rails (`migration.rb:168-180`) appends `RAILS_ENV=#{::Rails.env}` (after a space) on `defined?(Rails.env) && !Rails.env.local?`.
- `MigrationContext#lastStoredEnvironment` (`migration.ts`) raises `NoEnvironmentInSchemaError` with a hand-passed one-line message, `"... run: bin/rails db:environment:set"`. Rails' `NoEnvironmentInSchemaError#initialize` (`migration.rb:196-205`) takes no argument and builds `"Environment data not found in the schema. To resolve this issue, run: \n\n        bin/rails db:environment:set"`, with the same `defined?(Rails.env)` / else arms as `EnvironmentMismatchError`; `last_stored_environment` raises it bare.
- `DatabaseTasks.loadSchema`'s missing-file message (`packages/activerecord/src/tasks/database-tasks.ts`, mirroring `tasks/database_tasks.rb:484`) prints `bin/rails db:migrate`.

## Acceptance criteria

- [ ] All three print the `bin/trails db <subcommand>` spelling trailties' `db` command accepts, and `TRAILS_ENV=` where Rails prints `RAILS_ENV=`.
- [ ] `detailedMigrationMessage`'s env arm is `defined?(Rails.env) && !Rails.env.local?` as a `TopLevel.Trails` read, not a `Migration.env()` string comparison.
- [ ] `NoEnvironmentInSchemaError`'s constructor takes no argument and builds Rails' message with both arms; `lastStoredEnvironment` raises it bare, as `migration.rb` does.
- [ ] Tests pin each message in the seated and unseated `TopLevel.Trails` arms.
