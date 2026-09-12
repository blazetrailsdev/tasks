---
title: "converge-migration-area-moved-residue"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

`receipt-moved-migration-method-missing-delegations` (trails#TBD) resolved the 51 moved extras
in the migration area. Forty-five of them are the `method_missing` delegator block and point at
`migration-delegators-belong-on-current-not-migration`; `Migration.get` points at
`converge-receipted-activerecord-root-and-adapter-names`, which owns its twin `forVersion`. The
five below are each a separate divergence and land here.

- `migration.ts` `change` — Rails' `Migration` declares NO `change`. `exec_migration`
  (`vendor/rails/activerecord/lib/active_record/migration.rb:985-999`) branches on
  `respond_to?(:change)`, so a migration that defines only `up`/`down` takes the
  `public_send(direction)` arm. trails' empty `async change(): Promise<void> {}` makes that
  predicate unconditionally true, and `up`/`down` route around it through
  `_legacyClassDirection` instead. Converge by deleting `change` and having
  `migrate`/`execMigration` test for an own `change` the way Ruby's `respond_to?` does.
- `migration/compatibility.ts` `currentVersion` — Rails puts this on `Migration`
  (`migration.rb:633`, `def self.current_version`), not on `Migration::Compatibility`.
  Route 2: relocate it to `migration.ts` as `static currentVersion()` and repoint the
  re-export at `migration.ts:62` plus `migrator.trails.test.ts:19`.
- `migration/compatibility.ts` `Compatibility#version` — `Compatibility`
  (`migration/compatibility.rb:5`) is a module of `V*` subclasses and declares no `version`;
  the interface member is trails' registry shape.
- `schema-dumper.ts` `dumpTableSchema` — this is a TEST helper in Rails
  (`vendor/rails/activerecord/test/support/schema_dumping_helper.rb:4`,
  `def dump_table_schema(*tables)`), mixed into the test case and called bare. trails declares
  it as a static on the production `SchemaDumper`. Converge by moving it into
  `test-helpers/` as `SchemaDumpingHelper#dumpTableSchema`, which also takes it out of the
  measured population — the ~25 `SchemaDumper.dumpTableSchema(adapter, name)` call sites in
  `*.test.ts` are the cost, which is why it did not fit the receipt PR.
- `schema.ts` `constructor` — Rails' `ActiveRecord::Schema` (`schema.rb`) defines no
  `initialize`; `define` assigns `@connection` from the pool
  (`schema.rb:56-66`). The adapter-taking constructor exists for
  `active-record-schema.test.ts:62`.

## Acceptance criteria

- [ ] Each name above is deleted or relocated, and its `@noRailsEquivalent CONVERGEABLE`
      receipt comes out with it.
- [ ] `pnpm parity:api:extra --package activerecord` reports 0 extras for `migration.ts`
      (`change`), `migration/compatibility.ts`, `schema-dumper.ts` and `schema.ts`.
- [ ] `pnpm parity:api:extra:tighten` writes activerecord's `total` mark DOWN.
