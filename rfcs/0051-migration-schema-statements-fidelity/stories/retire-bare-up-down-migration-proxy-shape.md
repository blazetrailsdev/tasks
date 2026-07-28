---
title: "retire-bare-up-down-migration-proxy-shape"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
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

PR #5525 collapsed the duplicated migration banner logic: `Migrator#_runMigration`
(`packages/activerecord/src/migration.ts`) now calls `migration.migrate(direction)`
as Rails does (`vendor/rails/activerecord/lib/active_record/migration.rb:1534`),
and the announce/benchmark/announce/write sequence lives only in
`Migration#migrate` (`migration.rb:964-983`).

It got there by wrapping whatever `MigrationProxy.migration()` yields in a
file-local `MigrationProxyDelegate extends Migration` carrying the proxy's
name/version. That was the behaviour-preserving move, because a trails
`MigrationProxy` is a plain record whose `migration()` commonly yields a bare
`{ up, down }` object with no `migrate`/`announce` — the shape most test
helpers and both `Migrator.discoverMigrations` / `Migrator.fromPath` produce
(they return `mod.default` unchanged).

Rails has no such wrapper. `MigrationProxy#load_migration`
(`migration.rb:1195-1200`) builds a real migration with
`name.constantize.new(name, version)` and `delegate :migrate, :announce,
:write, :disable_ddl_transaction, to: :migration` (`migration.rb:1187`) hands
straight to it.

The remaining gap: because the wrapper is uniform, a loaded migration that IS
a real `Migration` never gets to use its own `migrate`/`announce`/`write` — an
override on a user subclass is silently bypassed. Rails would honour it.

PR #5525 made this fixable by teaching `Migration#name`/`#version` to prefer
the `@name`/`@version` set in `initialize` (`migration.rb:889`), so a proxy can
now construct `new Klass(name, version)` and get correct banner identity
without the wrapper.

## Acceptance criteria

- [ ] `Migrator.discoverMigrations` / `Migrator.fromPath` construct the loaded
      migration as `new Klass(name, version)`, mirroring
      `MigrationProxy#load_migration` (`migration.rb:1195-1200`), so
      `migration()` yields a real `Migration`.
- [ ] The bare `{ up, down }` proxy shape is retired from
      `MigrationLike`/test helpers, or `MigrationProxyDelegate` is narrowed to
      only that shape rather than wrapping unconditionally.
- [ ] A migration subclass overriding `announce` (or `write`) has its override
      honoured when run through the Migrator, as Rails' delegation does.
- [ ] The banner tests added in PR #5525
      (`migrator.trails.test.ts`, "Migrator drives migrations through
      Migration#migrate") still pass unchanged.
