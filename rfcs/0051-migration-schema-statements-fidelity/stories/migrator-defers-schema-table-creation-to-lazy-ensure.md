---
title: "Collapse the lazy _ensureSchemaTable scaffolding toward Rails' constructor-time table creation"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Migrator#initialize` creates both bookkeeping tables eagerly, as the
last thing it does
(`vendor/rails/activerecord/lib/active_record/migration.rb:1419-1431`):

```ruby
def initialize(direction, migrations, schema_migration, internal_metadata, target_version = nil)
  ...
  validate(@migrations)

  @schema_migration.create_table
  @internal_metadata.create_table
end
```

trails (`packages/activerecord/src/migration.ts`) instead defers this to a
lazy `_ensureSchemaTable()` guarded by a per-instance `_schemaTableEnsured`
boolean, called from roughly a dozen methods (`runWithoutLock`,
`migrateWithoutLock`, `recordEnvironment`, `currentVersion`, `getAllVersions`,
`pendingMigrations`, `migrationsStatus`, `checkEnvironment`, `rollback`,
`forward`, …). The constructor creates nothing.

This is a trails invention with two visible consequences:

- The `_ensureSchemaTable()` call is repeated at the top of nearly every public
  method purely as scaffolding, and any new method that forgets it gets a
  "no such table" failure instead of Rails' guaranteed-present tables. It is
  pure boilerplate that Rails does not have.
- Since PR #5484 made construction per-run, the memo flag now resets on every
  `run` / `up` / `down` — so the lazy path re-checks once per run anyway,
  eroding whatever saving the laziness bought.

The reason the deferral exists is presumably that trails' `createTable` is
async while the constructor is not, so the eager Rails ordering cannot be
reproduced literally. Converging therefore means deciding where the await goes
— an async factory (`Migrator.create(...)`), or keeping a single lazy call in
the two entry points (`run` / `migrate`) rather than sprinkling it — not a
mechanical move.

## Acceptance criteria

- The `_ensureSchemaTable()` call sites collapse to the smallest set that
  preserves Rails' invariant (both tables exist before any migration work),
  rather than being repeated per public method.
- `_schemaTableEnsured` either disappears or is documented at the call site as
  the deliberate stand-in for Rails' constructor-time creation, with the
  divergence justified there (not only in the PR body).
- Existing migration/migrator/tasks/CLI suites pass with no test renames.
