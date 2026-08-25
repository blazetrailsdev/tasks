---
title: "MigrationContext test sites pass schemaMigration/internalMetadata"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6199
claim: "2026-08-07T20:32:46Z"
assignee: "converge-comment-or-changes-descriptor-spellings"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the Migrator test construction sites in PR #6194
(`migrator-test-sites-adopt-rails-ctor-signature`). That story fixed
`new Migrator(...)`; the sibling `new MigrationContext(...)` sites in the same
file were left alone and still omit the bookkeeping objects.

Rails passes them at every `MigrationContext.new` in `migrator_test.rb`:

- `vendor/rails/activerecord/test/cases/migrator_test.rb:93`
  `ActiveRecord::MigrationContext.new(MIGRATIONS_ROOT + "/valid", @schema_migration, @internal_metadata).migrations`
- same shape at `migrator_test.rb:102`, `:112`, `:125`, and at
  `multi_db_migrator_test.rb:38-43` with the per-database `_a` / `_b` pairs.

trails' `packages/activerecord/src/migrator.test.ts` writes
`new MigrationContext([path])` bare at roughly ten sites (the "finds
migrations*", "relative migrations" and "migrations status*" cases), so
`MigrationContext` builds its own `SchemaMigration` / `InternalMetadata`
internally from the adapter instead of receiving the ones the test's `setup`
already holds. The suite now has `schemaMigration` / `internalMetadata`
in `beforeEach` (PR #6194), so the objects to pass are already in scope.

## Converged shape

Every `new MigrationContext(...)` in `migrator.test.ts` passes
`schemaMigration, internalMetadata`, mirroring `migrator_test.rb:93`. No test
leaves `MigrationContext` to invent a bookkeeping object its Rails counterpart
hands in.

## Acceptance criteria

- [ ] No bare `new MigrationContext([...])` remains in `migrator.test.ts`.
- [ ] Each converted site matches its `migrator_test.rb` counterpart's argument list.
- [ ] Test names unchanged; `pnpm parity:test` delta non-negative.
- [ ] Migrator suite green on all three lanes.
