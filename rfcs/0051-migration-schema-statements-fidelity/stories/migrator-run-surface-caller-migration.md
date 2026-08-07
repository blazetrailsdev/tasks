---
title: "migrator-run-surface-caller-migration"
status: blocked
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps:
  - unify-migration-discovery-delete-registered-migrations-seam
deps-rfc: []
est-loc: null
priority: 180
pr: null
claim: "2026-08-02T00:36:05Z"
assignee: "migrator-run-surface-caller-migration"
blocked-by: "Re-checked 2026-08-02 (second pass). Original blocker migrator-keeps-only-its-rails-1404-surface is DONE and verified on origin/main: no MigrationContext-style banner, no fromPath/fromDir/fromPaths/discoverMigrations statics, no Migrator#isProtectedEnvironment. The live blocker is now the Decision section: PR 5860 (migration-context-built-by-subclass-override-not-paths) was CLOSED UNMERGED, so the 4th 'registeredMigrations' constructor argument the ~24 caller migrations were going to use does NOT exist on origin/main (git grep registeredMigrations packages/activerecord/src -> no hits). How a caller holding a pre-built MigrationProxy[] reaches a MigrationContext is now settled by unify-migration-discovery-delete-registered-migrations-seam, which unifies the two discovery paths instead. Unblock when that lands; the Decision section in this body is stale and must be re-read against the unify story first."
closed-reason: null
---

## Context

`migrator-keeps-only-its-rails-1404-surface` finished the first half: every
`MigrationContext` run method in `packages/activerecord/src/migration.ts` now
has a real body (`migrate` / `up` / `down` / `run` / `migrationsStatus` /
`move` / `lastStoredEnvironment` / `protectedEnvironment`), so nothing on
`MigrationContext` delegates back into `Migrator` any more, and the discovery
statics (`Migrator.fromPath` / `fromDir` / `fromPaths` / `discoverMigrations`)
plus `Migrator#migrationsPaths`, `Migrator#isProtectedEnvironment` and
`Migrator#move` are gone.

What is left under the banner
`// --- MigrationContext-style methods (Rails: MigrationContext) ---` in
`Migrator` is the set whose _callers_ still hold a `Migrator`:
`schemaMigration`, `open`, `needsMigration`, `pendingMigrationVersions`,
`currentEnvironment`, `lastStoredEnvironment`, plus the MigrationContext-shaped
`migrate(targetVersion, block)` / `up` / `down` / `rollback` / `forward` /
`run(direction, target)` / `migrationsStatus` / `pendingMigrations`. Rails'
`Migrator` (`vendor/rails/activerecord/lib/active_record/migration.rb:1404-1620`)
owns only `current_version` / `current_migration` (alias `current`) / `run` /
`migrate` — both no-arg, reading `@direction` / `@target_version` —
`runnable` / `migrations` / `pending_migrations` / `migrated` / `load_migrated`
and the privates, plus the statics `migrations_paths` + `current_version`.

The blocker is the ~24 non-test call sites that construct
`new Migrator(adapter, migrations, options)` from an in-memory
`MigrationProxy[]` and then call the MigrationContext-shaped surface:
`packages/trailties/src/commands/db.ts` (`createMigrator` /
`withMigratorForDb` and ~10 command bodies),
`packages/activerecord/src/tasks/database-tasks.ts:343,619,1148`,
`packages/activerecord-cli/src/pending-migrations.ts`,
`packages/activerecord/src/test-databases.ts`,
`packages/website/src/lib/frontiers/trail-cli.ts`, plus `CheckPending`.
Rails' `MigrationContext` is path-based (`migrations_paths`, constructor arg),
so repointing those callers needs a decision about how a caller holding a
pre-built migration list reaches a `MigrationContext` — trailties has its own
`discoverMigrations` loader (`packages/trailties/src/migration-loader.ts`)
rather than `MigrationContext#migrations`.

`MigrationContext#up` / `down` / `run` also spell out
`isUseAdvisoryLock() ? withAdvisoryLock(...) : ...` inline because
`Migrator#migrate` / `#run` still carry the MigrationContext-shaped signatures;
Rails just writes `Migrator.new(...).migrate` / `.run`.

## Decision: how a caller holding a pre-built migration list reaches a MigrationContext

Settled by `migration-context-built-by-subclass-override-not-paths`.
`MigrationContext`'s constructor takes a fourth optional argument,
`registeredMigrations?: MigrationProxy[]`; when present, `#migrations` answers
that list instead of scanning `migrationsPaths`. It is per-instance
constructor state, exactly like `migrationsPaths`, so `#migrations` stays a
single un-overridden reader and no production code subclasses
`MigrationContext` (`DatabaseTasks._migrationContextFor` no longer does).

So each of the ~24 callers that today writes
`new Migrator(adapter, migrations, options)` becomes

```ts
new MigrationContext([], schemaMigration, internalMetadata, migrations);
```

passing `[]` (or the config's `migrationsPaths`, when it has some) for the
discovery half. Callers that already discover from disk — trailties'
`migration-loader` — keep loading as they do and hand the resulting
`MigrationProxy[]` in the same way; unifying the two discovery paths is not
part of this story.

## Acceptance criteria

- [ ] The `MigrationContext-style` banner block is gone from `Migrator`.
- [ ] `Migrator#migrate` and `Migrator#run` take no arguments and read
      `@direction` / `@target_version`, as `migration.rb:1444-1458` does.
- [ ] `MigrationContext#up` / `down` / `run` call `Migrator#migrate` /
      `Migrator#run` directly instead of spelling out the advisory-lock pair.
- [ ] Every caller listed above reaches the run surface through a
      `MigrationContext`, and `Migrator` keeps only what
      `migration.rb:1404-1620` gives it.
- [ ] Existing migrator / migration / trailties `db` tests keep their
      Rails-verbatim names and pass.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, the LOC ceiling, single PR from main.
