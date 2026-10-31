---
title: "generators-migration-is-an-included-module"
status: draft
updated: 2026-10-31
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Migration` is a module generators include (`vendor/rails/v8.0.2/railties/lib/rails/generators/migration.rb:11`). `packages/trailties/src/generators/migration.ts` has no module: `MigrationGenerator` carries `createMigration = createMigration` as an instance field and calls `migrationTemplate.call(this as unknown as MigrationTemplateHost, ...)`, because its private `migrationTemplate` field (`active-record/migration/migration-generator.ts:55`) shadows the Rails method.

## Acceptance criteria

- [ ] `Migration` is a module the generator takes with `include()`, and `createMigration`, `setMigrationAssigns` and `migrationTemplate` are its members.
- [ ] The private field is renamed so `this.migrationTemplate(...)` is the Rails call, with no cast.
