---
title: "Converge CreateMigration onto a subclass of the ported Thor::Actions::CreateFile"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["converge-generator-base-file-actions-onto-thor-actions"]
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Actions::CreateMigration < Thor::Actions::CreateFile`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/actions/create_migration.rb:9-76`) overrides `migration_dir`, `migration_file_name`,
`identical?`, `revoke!`, `existing_migration` / `relative_existing_migration`, `on_conflict_behavior`
and `say_status`. trailties' `packages/trailties/src/generators/actions/create-migration.ts` (141 lines) re-implements it
standalone, because there was no `CreateFile` to extend. The blocked
`migration-template-expands-the-source-template-path` (0142) waits on this and on
`thor-actions-template-is-unported`.

## Acceptance criteria

- [ ] `CreateMigration extends Thor.Actions.CreateFile` and overrides exactly Rails' members.
      Every other behavior (pretend, force, skip, conflict) comes from the base class.
- [ ] `create_migration.rb` reads complete in `parity:api --package trailties`.
