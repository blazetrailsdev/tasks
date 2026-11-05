---
title: "migration-generator-force-replaces-existing"
status: claimed
updated: 2026-11-05
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-05T12:36:28Z"
assignee: "rackup-handler-node-loads-through-handler-get"
blocked-by: null
closed-reason: null
---

## Context

trails#9640 made `AuthenticationGenerator#add_migrations` run `generate` as Rails does (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/authentication/authentication_generator.rb:51-52`), so its tests stub the command and no test asserts that `generate migration CreateUsers ... --force` replaces an existing migration. `packages/trailties/src/generators/migration-generator.test.ts` has no `--force` test. The model generator's "existing migration is removed on force" covers the shared path only.

## Acceptance criteria

- A trails test runs `MigrationGenerator` twice with `--force` and asserts one `create_users` migration with the `email_address` column and unique index.
